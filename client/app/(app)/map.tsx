import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable, SafeAreaView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { api } from "@/services/api";
import MapCanvas from "@/components/map/MapCanvas";
import PickListPanel from "@/components/map/PickListPanel";
import type { Node, RouteResponse } from "@/types";

export default function MapScreen() {
  const { productId, productName } = useLocalSearchParams<{
    productId?: string;
    productName?: string;
  }>();

  const { data: layouts, isLoading: layoutsLoading, isError: layoutsError } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle, isLoading: bundleLoading } = useLayoutBundle(firstLayoutId);

  const {
    userNodeId,
    activeRoute,
    activeStepIndex,
    setUserNodeId,
    setActiveRoute,
    clearNavigation,
    advance,
    setBearing,
  } = useNavigationStore();

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [collectedIndices, setCollectedIndices] = useState<number[]>([]);

  // Auto-calculate route when userNodeId and productId are both set
  useEffect(() => {
    if (!userNodeId || !productId || !firstLayoutId) return;
    let cancelled = false;

    const calculateRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const { data } = await api.post<RouteResponse>("/navigation/route", {
          layout_id: firstLayoutId,
          start_node_id: userNodeId,
          product_ids: [productId],
        });
        if (!cancelled) setActiveRoute(data);
      } catch {
        if (!cancelled) setRouteError("Não foi possível calcular a rota.");
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    calculateRoute();
    return () => {
      cancelled = true;
    };
  }, [userNodeId, productId, firstLayoutId, setActiveRoute]);

  const handleNodePress = useCallback(
    (node: Node) => {
      setUserNodeId(node.id);
    },
    [setUserNodeId]
  );

  const handleClearRoute = useCallback(() => {
    clearNavigation();
    setRouteError(null);
    setCollectedIndices([]);
  }, [clearNavigation]);

  const handleCollect = useCallback(
    (index: number) => {
      setCollectedIndices((prev) => [...prev, index]);
      advance();
    },
    [advance]
  );

  const handleSkip = useCallback(
    (_index: number) => {
      // For now: skip = also advance (can be improved later)
      advance();
    },
    [advance]
  );

  // Bearing computation (derived, not stored)
  const bearingDeg = useMemo(() => {
    if (!activeRoute || !bundle) return 0;
    const seg = activeRoute.segments[activeStepIndex ?? 0];
    if (!seg?.shelf_front_x || !seg?.shelf_front_y) return 0;
    const uNode = bundle.nodes.find((n) => n.id === userNodeId);
    if (!uNode) return 0;
    return (
      Math.atan2(seg.shelf_front_x - uNode.x, uNode.y - seg.shelf_front_y) *
      (180 / Math.PI)
    );
  }, [activeRoute, activeStepIndex, userNodeId, bundle]);

  // Sync bearingDeg into store so navigation.tsx MiniMap stays in sync
  useEffect(() => {
    setBearing(bearingDeg);
  }, [bearingDeg, setBearing]);

  // Product pins (derived)
  const productPins = useMemo(() => {
    if (!activeRoute || !bundle) return [];
    return activeRoute.segments
      .filter(
        (s) =>
          s.shelf_front_node_id &&
          s.shelf_front_x != null &&
          s.shelf_front_y != null
      )
      .map((s, i) => ({
        nodeId: s.shelf_front_node_id!,
        number: i + 1,
        x: s.shelf_front_x!,
        y: s.shelf_front_y!,
      }));
  }, [activeRoute, bundle]);

  // Collect all path nodes for highlighting
  const highlightedNodeIds = activeRoute?.waypoints ?? [];

  const isLoading = layoutsLoading || bundleLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f0eb" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#1E3932",
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: "#ffffff", fontSize: 20 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#ffffff" }}>
            {productName ? `Buscando: ${productName}` : "Mapa da Loja"}
          </Text>
          {!userNodeId && (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                marginTop: 2,
              }}
            >
              Toque em um ponto do mapa para definir sua posição
            </Text>
          )}
          {!productId && (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                marginTop: 2,
              }}
            >
              Busque um produto para ver a rota no mapa
            </Text>
          )}
          {userNodeId && !activeRoute && productId && (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                marginTop: 2,
              }}
            >
              Calculando rota...
            </Text>
          )}
          {activeRoute && (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: "#d4e9e2",
                marginTop: 2,
              }}
            >
              Rota calculada ✓
            </Text>
          )}
        </View>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#00754A" />
          <Text
            style={{
              marginTop: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: "rgba(0,0,0,0.58)",
            }}
          >
            Carregando mapa...
          </Text>
        </View>
      ) : layoutsError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.58)", textAlign: "center" }}>
            Erro ao carregar o mapa. Verifique sua conexão.
          </Text>
        </View>
      ) : !bundle ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              color: "rgba(0,0,0,0.58)",
              textAlign: "center",
            }}
          >
            Nenhum mapa disponível no momento.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Map canvas area */}
          <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
            {routeLoading && (
              <View
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  backgroundColor: "#00754A",
                  borderRadius: 50,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                  }}
                >
                  Calculando...
                </Text>
              </View>
            )}
            {routeError && (
              <View
                style={{
                  position: "absolute",
                  top: 16,
                  left: 24,
                  right: 24,
                  zIndex: 10,
                  backgroundColor: "#c82014",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {routeError}
                </Text>
              </View>
            )}
            <MapCanvas
              nodes={bundle.nodes}
              edges={bundle.edges}
              shelves={bundle.shelves}
              productPins={productPins}
              bearingDeg={bearingDeg}
              tiltEnabled={!!activeRoute}
              layoutWidthM={bundle.layout.width_m}
              layoutHeightM={bundle.layout.height_m}
              userNodeId={userNodeId}
              highlightedNodeIds={highlightedNodeIds}
              onNodeTap={handleNodePress}
            />

            {/* FAB — re-center / position mode toggle */}
            <Pressable
              onPress={handleClearRoute}
              accessibilityLabel="Recentrar mapa"
              accessibilityRole="button"
              style={({ pressed }) => ({
                position: "absolute",
                bottom: 16,
                right: 16,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#1E3932",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.95 : 1 }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 6,
              })}
            >
              <Text style={{ fontSize: 20 }}>📍</Text>
            </Pressable>
          </View>

          {/* Pick list panel */}
          {activeRoute && (
            <PickListPanel
              segments={activeRoute.segments}
              activeIndex={activeStepIndex ?? 0}
              collectedIndices={collectedIndices}
              onCollect={handleCollect}
              onSkip={handleSkip}
              onStartNavigation={() => router.push("/(app)/navigation")}
              totalDistanceM={activeRoute.total_distance_m}
              totalSeconds={activeRoute.total_estimated_seconds}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
