import { useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useProductSearch } from "@/hooks/useProducts";
import type { Product } from "@/types";

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useProductSearch(query);

  const handleProductPress = useCallback((product: Product) => {
    router.push({
      pathname: "/(app)/map",
      params: { productId: product.id, productName: product.name },
    });
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <Pressable
        onPress={() => handleProductPress(item)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "#ffffff",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f2f0eb",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 60,
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "rgba(0,0,0,0.87)", marginBottom: 2 }}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(0,0,0,0.58)" }}>
            {item.shelf?.label ?? item.shelf?.aisle ?? "Prateleira"}
          </Text>
        </View>
        {item.category ? (
          <View style={{ backgroundColor: "#d4e9e2", borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#006241" }}>
              {item.category}
            </Text>
          </View>
        ) : null}
      </Pressable>
    ),
    [handleProductPress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f0eb" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#1E3932", paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#ffffff", letterSpacing: -0.16 }}>
          Meu Guia do Super
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>
          Encontre qualquer produto na loja
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ backgroundColor: "#1E3932", paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ backgroundColor: "#ffffff", borderRadius: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, minHeight: 48 }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar produto..."
            placeholderTextColor="rgba(0,0,0,0.38)"
            style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.87)" }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Text style={{ fontSize: 18, color: "rgba(0,0,0,0.38)" }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      {query.length >= 2 ? (
        isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#00754A" />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.58)", textAlign: "center" }}>
              Erro ao buscar produtos. Verifique sua conexão.
            </Text>
          </View>
        ) : !data?.items?.length ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(0,0,0,0.58)", textAlign: "center" }}>
              Nenhum produto encontrado para "{query}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={data.items}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            style={{ backgroundColor: "#ffffff" }}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "rgba(0,0,0,0.58)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Recentes
          </Text>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(0,0,0,0.38)", textAlign: "center" }}>
              Suas buscas recentes aparecerão aqui
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
