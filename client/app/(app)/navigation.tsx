import { useCallback } from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { useNavigationStore } from "@/stores/useNavigationStore";

export default function NavigationScreen() {
  const { activeRoute, clearNavigation, phase, activeStepIndex, advance } = useNavigationStore();

  const handleFinish = useCallback(() => {
    clearNavigation();
    router.replace("/(app)");
  }, [clearNavigation]);

  if (!activeRoute || activeRoute.segments.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f0eb", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.58)", textAlign: "center", marginBottom: 24 }}>
          Nenhuma rota ativa. Volte ao mapa para calcular uma rota.
        </Text>
        <Pressable
          onPress={() => router.replace("/(app)/map")}
          style={{ backgroundColor: "#00754A", borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28, minHeight: 48 }}
        >
          <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Ir para o mapa</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalSteps = activeRoute.segments.length;
  const isComplete = phase === "arrived" || activeStepIndex >= totalSteps;
  const currentSegment = isComplete ? null : activeRoute.segments[activeStepIndex];

  const stepLabels = activeRoute.segments.map((seg, i) => {
    if (seg.product_id) return `Pegar item ${i + 1}`;
    return `Avançar ${seg.distance_m.toFixed(1)}m`;
  });

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)} min`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1E3932" }}>
      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 24, marginTop: 16, borderRadius: 2 }}>
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
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {isComplete ? "Concluído" : `Passo ${activeStepIndex + 1} de ${totalSteps}`}
        </Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        {isComplete ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 28, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
              Chegou!
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 16, color: "rgba(255,255,255,0.70)", textAlign: "center" }}>
              Você completou o percurso de {activeRoute.total_distance_m.toFixed(1)}m.
            </Text>
          </View>
        ) : (
          <View>
            {/* Direction */}
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 32, color: "#ffffff", letterSpacing: -0.16, marginBottom: 16 }}>
              {stepLabels[activeStepIndex]}
            </Text>

            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 24, marginBottom: 24 }}>
              <View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Distância
                </Text>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 24, color: "#d4e9e2", marginTop: 4 }}>
                  {currentSegment!.distance_m.toFixed(1)}m
                </Text>
              </View>
              <View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Tempo
                </Text>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 24, color: "#d4e9e2", marginTop: 4 }}>
                  {formatTime(currentSegment!.estimated_seconds)}
                </Text>
              </View>
            </View>

            {/* Step list preview (next 3 steps) */}
            {activeStepIndex + 1 < totalSteps && (
              <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.40)", marginBottom: 8 }}>A seguir:</Text>
                {stepLabels.slice(activeStepIndex + 1, activeStepIndex + 4).map((label, i) => (
                  <Text key={i} style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.58)", paddingVertical: 3 }}>
                    {activeStepIndex + i + 2}. {label}
                  </Text>
                ))}
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
                {activeStepIndex + 1 === totalSteps ? "Finalizar" : "Próximo →"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              style={{ paddingVertical: 12, alignItems: "center", minHeight: 44 }}
            >
              <Text style={{ color: "rgba(255,255,255,0.58)", fontFamily: "Inter_400Regular", fontSize: 14 }}>
                Encerrar navegação
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => ({
              backgroundColor: "#00754A",
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: "center",
              transform: [{ scale: pressed ? 0.95 : 1 }],
              minHeight: 56,
            })}
          >
            <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 18 }}>Concluir</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
