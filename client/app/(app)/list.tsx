import { useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useGroceryLists,
  useGroceryList,
  useRemoveGroceryItem,
  useUpdateGroceryItem,
  useOptimizeGroceryList,
} from "@/hooks/useGroceryLists";
import type { GroceryItem } from "@/types";

export default function ListScreen() {
  const { isAuthenticated } = useAuthStore();
  const { data: lists, isLoading: listsLoading } = useGroceryLists();
  const firstListId = lists?.[0]?.id ?? null;
  const { data: list, isLoading: listLoading } = useGroceryList(firstListId);
  const removeItem = useRemoveGroceryItem(firstListId ?? "");
  const updateItem = useUpdateGroceryItem(firstListId ?? "");
  const optimize = useOptimizeGroceryList(firstListId ?? "");

  const renderItem = useCallback(
    ({ item }: { item: GroceryItem }) => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f2f0eb",
          minHeight: 60,
        }}
      >
        {/* Check button */}
        <Pressable
          onPress={() => updateItem.mutate({ itemId: item.id, checked: !item.checked })}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: item.checked ? "#00754A" : "#d6dbde",
            backgroundColor: item.checked ? "#00754A" : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
          hitSlop={8}
        >
          {item.checked && <Text style={{ color: "#ffffff", fontSize: 14, lineHeight: 16 }}>✓</Text>}
        </Pressable>

        {/* Name */}
        <Text
          style={{
            flex: 1,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: item.checked ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.87)",
            textDecorationLine: item.checked ? "line-through" : "none",
          }}
          numberOfLines={2}
        >
          {item.product_name_snapshot}
        </Text>

        {/* Delete button */}
        <Pressable
          onPress={() => removeItem.mutate(item.id)}
          hitSlop={8}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: 8 }}
        >
          <Text style={{ fontSize: 18, color: "rgba(0,0,0,0.38)" }}>✕</Text>
        </Pressable>
      </View>
    ),
    [updateItem, removeItem]
  );

  // Not authenticated guard
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f2f0eb", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#006241", textAlign: "center", marginBottom: 8 }}>Lista de Compras</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(0,0,0,0.58)", textAlign: "center", marginBottom: 24 }}>
          Faça login para salvar e acessar sua lista de compras.
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => ({
            backgroundColor: "#00754A",
            borderRadius: 50,
            paddingVertical: 14,
            paddingHorizontal: 32,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            minHeight: 48,
          })}
        >
          <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 16 }}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  const isLoading = listsLoading || listLoading;
  const items = list ? [...list.items].sort((a, b) => a.sort_order - b.sort_order) : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f0eb" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#1E3932", paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#ffffff", letterSpacing: -0.16 }}>
          Lista de Compras
        </Text>
        {list && (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>
            {items.length} {items.length === 1 ? "item" : "itens"}
          </Text>
        )}
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#00754A" />
        </View>
      ) : !list || items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.58)", textAlign: "center", marginBottom: 24 }}>
            Lista vazia. Busque um produto para adicionar.
          </Text>
          <Pressable
            onPress={() => router.push("/(app)")}
            style={({ pressed }) => ({
              backgroundColor: "#00754A",
              borderRadius: 50,
              paddingVertical: 12,
              paddingHorizontal: 28,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              minHeight: 48,
            })}
          >
            <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Buscar produto</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
          />

          {/* Bottom optimize bar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#ffffff",
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 32,
              borderTopWidth: 1,
              borderTopColor: "#f2f0eb",
            }}
          >
            <Pressable
              onPress={() => optimize.mutate()}
              disabled={optimize.isPending}
              style={({ pressed }) => ({
                backgroundColor: "#00754A",
                borderRadius: 50,
                paddingVertical: 14,
                alignItems: "center",
                opacity: optimize.isPending ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
                minHeight: 48,
              })}
            >
              {optimize.isPending ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 16 }}>Calculando...</Text>
                </View>
              ) : (
                <Text style={{ color: "#ffffff", fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                  🗺️ Otimizar rota
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
