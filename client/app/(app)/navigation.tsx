import { useCallback } from "react";
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
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import { useLayouts, useLayoutBundle } from "@/hooks/useLayouts";
import SkiaMapCanvas from "@/components/map/SkiaMapCanvas";
import SwipeableItemCard from "@/components/map/SwipeableItemCard";
import ConfirmationOverlay from "@/components/map/ConfirmationOverlay";
import { colors, spacing, elevation } from "@/theme/tokens";

export default function NavigationScreen() {
  const { width, height } = useWindowDimensions();
  const navBarH = spacing.navBarHeight + spacing.safeAreaTop;
  const drawerH = spacing.drawerActive;
  const canvasH = height - navBarH - drawerH;

  const {
    activeRoute,
    activeStepIndex,
    navState,
    setNavState,
    advance,
    clearNavigation,
    activeSupermarketId,
  } = useNavigationStore();

  const { items, removeItem } = useGroceryListStore();
  const { data: layouts } = useLayouts(activeSupermarketId);
  const firstLayoutId = layouts?.[0]?.id ?? null;
  const { data: bundle } = useLayoutBundle(firstLayoutId);

  const activeItem = items[0] ?? null;
  const activeSegment = activeRoute?.segments[activeStepIndex];
  const distanceM = activeSegment?.distance_m ?? 0;
  const distanceLabel = `${distanceM.toFixed(0)}m`;

  const userPos = (() => {
    if (!bundle || !activeSegment) return null;
    const node = bundle.nodes.find((n) => n.id === activeSegment.from_node_id);
    return node ? { x: node.x, y: node.y } : null;
  })();

  const handleReveal = useCallback(
    () => setNavState("SWIPE_REVEALED"),
    [setNavState],
  );
  const handlePick = useCallback(
    () => setNavState("CONFIRMING"),
    [setNavState],
  );

  const handleSkip = useCallback(() => {
    if (!activeItem) return;
    // Move first item to end of queue
    const reordered = [...items.slice(1), items[0]];
    useGroceryListStore
      .getState()
      .reorderItems(reordered.map((item, i) => ({ ...item, sort_order: i })));
    setNavState("GUIDANCE_ACTIVE");
  }, [activeItem, items, setNavState]);

  const handleConfirmationComplete = useCallback(() => {
    setNavState("QUEUE_ADVANCING");
    if (activeItem) removeItem(activeItem.product_id);
    advance();
    const remaining = useGroceryListStore.getState().items;
    // Brief delay for camera pan animation, then move to next state
    setTimeout(() => {
      setNavState(remaining.length === 0 ? "TRIP_COMPLETE" : "GUIDANCE_ACTIVE");
    }, 200);
  }, [activeItem, removeItem, advance, setNavState]);

  if (navState === "TRIP_COMPLETE") {
    return (
      <View style={styles.tripContainer}>
        <Text style={styles.tripIcon}>🎉</Text>
        <Text style={styles.tripTitle}>Compras concluídas!</Text>
        <Text style={styles.tripSub}>Todos os itens foram coletados.</Text>
        <Pressable
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => {
            clearNavigation();
            useGroceryListStore.getState().clearList();
            router.replace("/(app)");
          }}
          accessibilityLabel="Ver resumo"
        >
          <Text style={styles.resetBtnText}>VER RESUMO</Text>
        </Pressable>
      </View>
    );
  }

  const totalStops = items.length + activeStepIndex;
  const stopLabel = `Parada ${activeStepIndex + 1} de ${totalStops > 0 ? totalStops : 1}`;

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
        <Text style={styles.navLabel}>● NAVEGAÇÃO AO VIVO</Text>
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
      <View style={{ height: canvasH }}>
        {bundle ? (
          <SkiaMapCanvas
            bundle={bundle}
            route={activeRoute}
            mode="2d"
            userPos={userPos}
            canvasWidth={width}
            canvasHeight={canvasH}
            activeSegmentIndex={activeStepIndex}
          />
        ) : (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandVibrant} size="large" />
          </View>
        )}
      </View>

      {/* Bottom drawer */}
      <View
        style={[styles.drawer, { paddingBottom: spacing.safeAreaBottom + 16 }]}
      >
        {/* Progress row */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {stopLabel} · <Text style={styles.distText}>{distanceLabel}</Text>
          </Text>
          <Pressable
            accessibilityLabel="Ver todos os itens"
            onPress={() => router.push("/(app)/list")}
          >
            <Text style={styles.seeAllText}>Ver tudo ↑</Text>
          </Pressable>
        </View>

        {/* Active item: confirmation flash OR swipe card */}
        {navState === "CONFIRMING" ? (
          <ConfirmationOverlay onComplete={handleConfirmationComplete} />
        ) : activeItem ? (
          <SwipeableItemCard
            item={activeItem}
            sequenceIndex={activeStepIndex + 1}
            distanceLabel={distanceLabel}
            onPick={handlePick}
            onSkip={handleSkip}
            onReveal={handleReveal}
            isRevealed={navState === "SWIPE_REVEALED"}
          />
        ) : null}

        {/* Remaining items (greyed out) */}
        {items.slice(1, 3).map((item) => (
          <View key={item.id} style={styles.remainingRow}>
            <Text style={styles.remainingText} numberOfLines={1}>
              • {item.product_name_snapshot}
            </Text>
            <Text style={styles.remainingChevron}>›</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  nav: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.routeActive,
    letterSpacing: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    gap: 8,
    ...elevation.drawer,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.gutter,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: colors.routeActive,
    fontFamily: "Courier New",
    fontWeight: "700",
  },
  distText: {
    color: colors.textPrimary,
    fontFamily: undefined,
    fontWeight: "700",
  },
  seeAllText: { fontSize: 12, color: colors.actionSkip, fontWeight: "600" },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
    opacity: 0.45,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
  },
  remainingChevron: { fontSize: 14, color: colors.textSecondary },
  tripContainer: {
    flex: 1,
    backgroundColor: colors.bgLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: spacing.gutter * 2,
  },
  tripIcon: { fontSize: 64 },
  tripTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.brandDark,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tripSub: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  resetBtn: {
    backgroundColor: colors.brandVibrant,
    borderRadius: spacing.pillRadius,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.brandDark,
    letterSpacing: 2,
  },
});
