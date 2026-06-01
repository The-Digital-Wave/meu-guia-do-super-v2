import { useCallback } from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import MiniMap from "@/components/map/MiniMap";

export default function NavigationScreen() {
  const { activeRoute, clearNavigation, phase, activeStepIndex, advance, bearingDeg } =
    useNavigationStore();

  const { data: layouts } = useLayouts();
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle } = useLayoutBundle(firstLayoutId);

  const handleFinish = useCallback(() => {
    clearNavigation();
    router.replace("/(app)");
  }, [clearNavigation]);

  if (!activeRoute || activeRoute.segments.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f2f0eb",
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
            marginBottom: 24,
          }}
        >
          Nenhuma rota ativa. Volte ao mapa para calcular uma rota.
        </Text>
        <Pressable
          onPress={() => router.replace("/(app)/map")}
          style={{
            backgroundColor: "#00754A",
            borderRadius: 50,
            paddingVertical: 12,
            paddingHorizontal: 28,
            minHeight: 48,
          }}
        >
          <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            Ir para o mapa
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalSteps = activeRoute.segments.length;
  const isComplete = phase === "arrived" || activeStepIndex >= totalSteps;
  const currentSegment = isComplete ? null : activeRoute.segments[activeStepIndex];
  const nextSegment =
    !isComplete && activeStepIndex + 1 < totalSteps
      ? activeRoute.segments[activeStepIndex + 1]
      : null;

  // Determine current waypoint node ID for MiniMap
  const currentWaypointNodeId = currentSegment?.to_node_id ?? null;

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)} min`;
  }

  const stepLabel = currentSegment?.product_name
    ? `Pegar: ${currentSegment.product_name}`
    : currentSegment
    ? `Avançar ${currentSegment.distance_m.toFixed(1)}m`
    : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1E3932" }}>
      {/* Progress bar */}
      <View
        style={{
          height: 4,
          backgroundColor: "rgba(255,255,255,0.2)",
          marginHorizontal: 24,
          marginTop: 16,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: "#00754A",
            width: `${isComplete ? 100 : (activeStepIndex / totalSteps) * 100}%`,
          }}
        />
      </View>

      {/* Step counter */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: "rgba(255,255,255,0.58)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {isComplete ? "Concluído" : `Parada ${activeStepIndex + 1} de ${totalSteps}`}
        </Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        {isComplete ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 28,
                color: "#ffffff",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Chegou!
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                color: "rgba(255,255,255,0.70)",
                textAlign: "center",
              }}
            >
              Você completou o percurso de {activeRoute.total_distance_m.toFixed(1)}m.
            </Text>
          </View>
        ) : (
          <View>
            {/* Direction row: MiniMap + direction text */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 20,
                gap: 16,
              }}
            >
              {/* MiniMap */}
              {bundle && (
                <MiniMap
                  nodes={bundle.nodes}
                  edges={bundle.edges}
                  shelves={bundle.shelves}
                  layout={bundle.layout}
                  currentWaypointNodeId={currentWaypointNodeId}
                  bearingDeg={bearingDeg}
                />
              )}

              {/* Direction text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#8e8e93",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Vá até
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    color: "#ffffff",
                    marginBottom: 4,
                  }}
                >
                  {currentSegment!.shelf_label ?? stepLabel}
                </Text>
                <Text style={{ fontSize: 13, color: "#8e8e93" }}>
                  {currentSegment!.distance_m.toFixed(1)}m · {formatTime(currentSegment!.estimated_seconds)}
                </Text>
              </View>
            </View>

            {/* Collection card */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#8e8e93",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Colete agora
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "rgba(0,0,0,0.87)",
                  marginBottom: 4,
                }}
              >
                {currentSegment!.product_name ?? `Item ${activeStepIndex + 1}`}
              </Text>
              <Text style={{ fontSize: 13, color: "#666666" }}>
                {currentSegment!.shelf_label ?? ""}
              </Text>
            </View>

            {/* Next stop preview */}
            {nextSegment ? (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.40)",
                    marginBottom: 4,
                  }}
                >
                  A seguir:
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {nextSegment.product_name ??
                    `Avançar ${nextSegment.distance_m.toFixed(1)}m`}{" "}
                  ({nextSegment.distance_m.toFixed(1)}m)
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  Última parada!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        {!isComplete ? (
          <>
            <Pressable
              onPress={advance}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: "#00754A",
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: "center",
                transform: [{ scale: pressed ? 0.95 : 1 }],
                minHeight: 56,
              })}
            >
              <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 18 }}>
                {activeStepIndex + 1 === totalSteps
                  ? "Finalizar"
                  : "✓ Marcar como coletado"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              style={{ paddingVertical: 12, alignItems: "center", minHeight: 44 }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.58)",
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                }}
              >
                Encerrar navegação
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleFinish}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: "#00754A",
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: "center",
              transform: [{ scale: pressed ? 0.95 : 1 }],
              minHeight: 56,
            })}
          >
            <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 18 }}>
              Concluir
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
