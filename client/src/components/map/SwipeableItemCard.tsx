import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import type { CartItem } from "@/stores/useGroceryListStore";
import { colors, spacing } from "@/theme/tokens";

const SWIPE_THRESHOLD = 64;
const LOCK_OFFSET = -160;

interface SwipeableItemCardProps {
  item: CartItem;
  sequenceIndex: number;
  distanceLabel: string;
  onPick: () => void;
  onSkip: () => void;
  onReveal: () => void;
  isRevealed: boolean;
}

export default function SwipeableItemCard({
  item, sequenceIndex, distanceLabel, onPick, onSkip, onReveal, isRevealed,
}: SwipeableItemCardProps) {
  const translateX = useSharedValue(isRevealed ? LOCK_OFFSET : 0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(LOCK_OFFSET, e.translationX);
      }
    })
    .onEnd(() => {
      if (translateX.value <= SWIPE_THRESHOLD * -1) {
        translateX.value = withSpring(LOCK_OFFSET);
        runOnJS(onReveal)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Action buttons revealed by swipe */}
      <View style={styles.actions}>
        <Pressable style={styles.skipBtn} onPress={onSkip} accessibilityLabel="Pular item">
          <Text style={styles.actionText}>PULAR</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={onPick} accessibilityLabel="Item coletado">
          <Text style={styles.actionText}>COLETADO →</Text>
        </Pressable>
      </View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated2.View style={[styles.card, cardStyle]}>
          <View style={styles.seqBadge}>
            <Text style={styles.seqText}>{sequenceIndex}</Text>
          </View>
          <View style={styles.thumb}>
            <Text style={{ fontSize: 24 }}>📦</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>{item.product_name_snapshot}</Text>
            <View style={styles.meta}>
              <View style={styles.skuBadge}>
                <Text style={styles.skuText}>{item.product_id.slice(0, 6).toUpperCase()}</Text>
              </View>
              <Text style={styles.distance}>{distanceLabel}</Text>
            </View>
          </View>
        </Animated2.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 80, marginHorizontal: spacing.gutter, marginBottom: 8, position: "relative", borderRadius: 12, overflow: "hidden" },
  actions: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, flexDirection: "row", borderRadius: 12 },
  skipBtn: { flex: 1, backgroundColor: colors.actionSkip, alignItems: "center", justifyContent: "center" },
  pickBtn: { flex: 1, backgroundColor: colors.actionPick, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.2)" },
  actionText: { fontSize: 10, fontWeight: "900", color: colors.white, letterSpacing: 1.5, textTransform: "uppercase" },
  card: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 12 },
  seqBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.waypointTarget, alignItems: "center", justifyContent: "center" },
  seqText: { fontSize: 11, fontWeight: "700", color: colors.white },
  thumb: { width: 48, height: 48, backgroundColor: colors.bgLight, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 18 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  skuBadge: { backgroundColor: colors.bgLight, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: colors.border },
  skuText: { fontSize: 9, fontWeight: "700", color: colors.textSecondary },
  distance: { fontSize: 10, fontWeight: "700", color: colors.routeActive },
});
