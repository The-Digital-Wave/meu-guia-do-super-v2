import { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, Pressable, SafeAreaView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { api } from "@/services/api";
import MapCanvas from "@/components/map/MapCanvas";
import RouteOverlay from "@/components/map/RouteOverlay";
import type { Node, RouteResponse } from "@/types";

export default function MapScreen() {
  const { productId, productName } = useLocalSearchParams<{
    productId?: string;
    productName?: string;
  }>();

  const { data: layouts, isLoading: layoutsLoading, isError: layoutsError } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle, isLoading: bundleLoading } = useLayoutBundle(firstLayoutId);

  const { userNodeId, activeRoute, setUserNodeId, setActiveRoute, clearNavigation } =
    useNavigationStore();

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

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

  const handleNodeTap = useCallback(
    (node: Node) => {
      setUserNodeId(node.id);
    },
    [setUserNodeId]
  );

  const handleClearRoute = useCallback(() => {
    clearNavigation();
    setRouteError(null);
  }, [clearNavigation]);

  const handleNavigate = useCallback(() => {
    router.push("/(app)/navigation");
  }, []);

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
              layoutWidthM={bundle.layout.width_m}
              layoutHeightM={bundle.layout.height_m}
              userNodeId={userNodeId}
              highlightedNodeIds={highlightedNodeIds}
              onNodeTap={handleNodeTap}
            />
          </View>

          {/* Route overlay bottom sheet */}
          {activeRoute && (
            <RouteOverlay
              route={activeRoute}
              onClearRoute={handleClearRoute}
              onNavigate={handleNavigate}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
