import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
import { api } from "@/services/api";
import { colors, spacing, elevation } from "@/theme/tokens";
import type { RouteResponse } from "@/types";

export default function MapScreen() {
  const { width, height } = useWindowDimensions();
  const navBarH = spacing.navBarHeight + spacing.safeAreaTop;
  const drawerH = spacing.drawerPeek + spacing.safeAreaBottom + 8;
  const canvasH = height - navBarH - drawerH;

  const { activeRoute, setActiveRoute, activeSupermarketId } =
    useNavigationStore();
  const { items } = useGroceryListStore();

  const { data: layouts } = useLayouts(activeSupermarketId);
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle, isLoading } = useLayoutBundle(firstLayoutId);

  const [routeLoading, setRouteLoading] = useState(false);

  async function handleStartNavigation() {
    if (!bundle || items.length === 0) return;
    setRouteLoading(true);
    try {
      const startNode = bundle.nodes.find((n) => n.node_type === "ENTRY");
      if (!startNode) throw new Error("No entry node found");
      const productIds = items.map((i) => i.product_id);
      const { data } = await api.post<RouteResponse>("/navigation/route", {
        layout_id: bundle.layout.id,
        start_node_id: startNode.id,
        product_ids: productIds,
      });
      setActiveRoute(data);
      router.push("/(app)/navigation");
    } catch {
      // Route calculation failed — stay on this screen; user can retry
    } finally {
      setRouteLoading(false);
    }
  }

  const totalDist = activeRoute
    ? `${activeRoute.total_distance_m.toFixed(0)}m`
    : "—";

  return (
    <View style={styles.container}>
      {/* Top nav */}
      <View
        style={[
          styles.nav,
          { height: navBarH, paddingTop: spacing.safeAreaTop + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} accessibilityLabel="Voltar">
          <Text style={styles.backBtn}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.navLabel}>VISÃO DA ROTA</Text>
        <View style={styles.avatar}>
          <Image
            source={require("../../src/assets/profile_fabio_1.jpeg")}
            style={styles.avatarImage}
            resizeMode="cover"
            accessibilityLabel="Avatar do Fabio"
          />
        </View>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {isLoading || !bundle ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandVibrant} size="large" />
          </View>
        ) : (
          <SkiaMapCanvas
            bundle={bundle}
            route={activeRoute}
            mode="2d"
            userPos={null}
            canvasWidth={width}
            canvasHeight={canvasH}
          />
        )}

        {/* Compass rose */}
        <View style={styles.compass}>
          <Text style={styles.compassN}>N</Text>
          <Text style={styles.compassArrow}>▲</Text>
        </View>
      </View>

      {/* Bottom drawer peek */}
      <View
        style={[styles.drawer, { paddingBottom: spacing.safeAreaBottom + 8 }]}
      >
        <View style={styles.drawerInfo}>
          <Text style={styles.drawerTitle}>Minha Lista</Text>
          <Text style={styles.drawerMeta}>
            {items.length} {items.length === 1 ? "item" : "itens"} · {totalDist}
          </Text>
        </View>
        <View style={styles.drawerCtas}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaStartTouch,
              (items.length === 0 || routeLoading) && styles.ctaDisabled,
              pressed && items.length > 0 && { opacity: 0.85 },
            ]}
            onPress={handleStartNavigation}
            disabled={items.length === 0 || routeLoading}
            accessibilityLabel="Iniciar navegação"
          >
            <View style={styles.cta}>
              {routeLoading ? (
                <ActivityIndicator color={colors.brandDark} size="small" />
              ) : (
                <Text style={styles.ctaStartText}>Iniciar</Text>
              )}
            </View>
          </Pressable>
          <Pressable
            style={styles.ctaItemsTouch}
            onPress={() => router.push("/(app)/list")}
            accessibilityLabel="Ver itens da lista"
          >
            <View style={styles.ctaItems}>
              <Text style={styles.ctaItemsText}>Ver itens</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  nav: {
    paddingHorizontal: spacing.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  backBtn: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  compass: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  compassN: { fontSize: 10, fontWeight: "700", color: colors.brandDark },
  compassArrow: { fontSize: 14, color: colors.brandDark },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.gutter,
    paddingTop: 16,
    gap: 12,
    ...elevation.drawer,
  },
  drawerInfo: { gap: 2 },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brandDark,
    letterSpacing: -0.3,
  },
  drawerMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  drawerCtas: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  cta: {
    backgroundColor: "#15803d",
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  ctaStartTouch: {
    flex: 1,
    borderRadius: spacing.pillRadius,
    overflow: "hidden",
  },
  ctaStart: {
    flex: 1,
    backgroundColor: colors.routeActive,
    borderRadius: spacing.pillRadius,
    paddingVertical: 12,
    paddingHorizontal: spacing.gutter,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.7 },
  ctaStartText: {
    fontSize: 10,
    paddingHorizontal: spacing.gutter,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ctaItemsTouch: {
    width: "50%",
    borderRadius: spacing.pillRadius,
    overflow: "hidden",
  },
  ctaItems: {
    flex: 1,
    backgroundColor: colors.actionSkip,
    borderRadius: spacing.pillRadius,
    paddingVertical: 12,
    paddingHorizontal: spacing.gutter,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaItemsText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.white,
    letterSpacing: 1,
    textAlign: "center",
  },
});
