import React from "react";
import { View, Text, Pressable } from "react-native";
import type { RouteResponse } from "@/types";

interface Props {
  route: RouteResponse;
  onClearRoute: () => void;
  onNavigate: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export default function RouteOverlay({ route, onClearRoute, onNavigate }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Route summary */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
        <View>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(0,0,0,0.58)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Distância
          </Text>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 20, color: "#006241", marginTop: 2 }}>
            {route.total_distance_m.toFixed(1)}m
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(0,0,0,0.58)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tempo estimado
          </Text>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 20, color: "#006241", marginTop: 2 }}>
            {formatTime(route.total_estimated_seconds)}
          </Text>
        </View>
      </View>

      {/* Action row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={onClearRoute}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#00754A",
            borderRadius: 50,
            paddingVertical: 12,
            alignItems: "center",
            minHeight: 48,
          }}
        >
          <Text style={{ color: "#00754A", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            Limpar rota
          </Text>
        </Pressable>
        <Pressable
          onPress={onNavigate}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: "#00754A",
            borderRadius: 50,
            paddingVertical: 12,
            alignItems: "center",
            transform: [{ scale: pressed ? 0.95 : 1 }],
            minHeight: 48,
          })}
        >
          <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            Iniciar navegação
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
