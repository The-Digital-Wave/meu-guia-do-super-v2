import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
} from "react-native";

interface Props {
  number: number;
  productName: string;
  shelfLabel: string | null;
  distanceM: number;
  isActive: boolean;
  isCollected: boolean;
  onCollect: () => void;
  onSkip: () => void;
}

const SWIPE_THRESHOLD = 40;
const ACTION_WIDTH = 120;
const BTN_WIDTH = 60;

export default function PickListItem({
  number,
  productName,
  shelfLabel,
  distanceM,
  isActive,
  isCollected,
  onCollect,
  onSkip,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const skipWidth = useRef(new Animated.Value(BTN_WIDTH)).current;
  const pickedWidth = useRef(new Animated.Value(BTN_WIDTH)).current;
  const rowHeight = useRef(new Animated.Value(72)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const rowMargin = useRef(new Animated.Value(0)).current;

  const snapOpen = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      tension: 150,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const snapClosed = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      tension: 150,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_, gs) => {
        const newX = Math.max(-ACTION_WIDTH, Math.min(0, gs.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gs) => {
        // @ts-expect-error _value is internal but safe here
        const current = translateX._value as number;
        if (gs.dx > 30 && current < -10) {
          snapClosed();
        } else if (current < -SWIPE_THRESHOLD) {
          snapOpen();
        } else {
          snapClosed();
        }
      },
    })
  ).current;

  const handleCardPress = useCallback(() => {
    // @ts-expect-error _value is internal
    const current = translateX._value as number;
    if (current < -5) snapClosed();
  }, [translateX, snapClosed]);

  const handlePicked = useCallback(() => {
    // 1. Collapse skip, expand picked (400ms)
    Animated.parallel([
      Animated.timing(skipWidth, { toValue: 0, duration: 400, useNativeDriver: false }),
      Animated.timing(pickedWidth, { toValue: ACTION_WIDTH, duration: 400, useNativeDriver: false }),
    ]).start(() => {
      // 2. After 400ms, slide card out + collapse height
      Animated.parallel([
        Animated.timing(translateX, { toValue: -400, duration: 300, useNativeDriver: true }),
        Animated.timing(rowHeight, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(rowMargin, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(rowOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start(() => {
        onCollect();
      });
    });
  }, [skipWidth, pickedWidth, translateX, rowHeight, rowMargin, rowOpacity, onCollect]);

  const handleSkip = useCallback(() => {
    snapClosed();
    onSkip();
  }, [snapClosed, onSkip]);

  // ── Collected state ──────────────────────────────────────────────
  if (isCollected) {
    return (
      <View style={[styles.row, { opacity: 0.55 }]}>
        <View style={[styles.badge, { backgroundColor: "#5bad27" }]}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 20 }}>🛍️</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.productName, { textDecorationLine: "line-through" }]}>
            {productName}
          </Text>
          <Text style={styles.subText}>
            {shelfLabel ? `${shelfLabel} · ` : ""}{distanceM.toFixed(1)}m
          </Text>
        </View>
      </View>
    );
  }

  // ── Upcoming state ───────────────────────────────────────────────
  if (!isActive) {
    return (
      <View style={[styles.row, { opacity: 0.7 }]}>
        <View style={[styles.badge, { backgroundColor: "#d1d5db" }]}>
          <Text style={[styles.badgeText, { color: "#6b7280" }]}>{number}</Text>
        </View>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 20 }}>🛍️</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.productName, { fontWeight: "400", color: "rgba(0,0,0,0.58)" }]}>
            {productName}
          </Text>
          <Text style={[styles.subText, { color: "#c7c7cc" }]}>
            {shelfLabel ? `${shelfLabel} · ` : ""}{distanceM.toFixed(1)}m
          </Text>
        </View>
      </View>
    );
  }

  // ── Active state (with swipe) ────────────────────────────────────
  return (
    <Animated.View style={[styles.swipeContainer, { height: rowHeight, marginBottom: rowMargin, opacity: rowOpacity }]}>
      {/* Action buttons revealed behind card */}
      <View style={styles.actionButtons}>
        <Animated.View style={{ width: skipWidth, overflow: "hidden" }}>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.actionBtnText}>⤫ Pular</Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={{ width: pickedWidth, overflow: "hidden" }}>
          <Pressable style={styles.pickedBtn} onPress={handlePicked}>
            <Text style={styles.actionBtnText}>✓ Coletado</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Swipeable card content */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }], borderLeftWidth: 3, borderLeftColor: "#00754A" }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={handleCardPress} style={styles.cardInner}>
          <View style={[styles.badge, { backgroundColor: "#e53e3e" }]}>
            <Text style={styles.badgeText}>{number}</Text>
          </View>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 20 }}>🛍️</Text>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.subText}>
              {shelfLabel ? `${shelfLabel} · ` : ""}{distanceM.toFixed(1)}m
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    overflow: "hidden",
    position: "relative",
    minHeight: 64,
  },
  actionButtons: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  skipBtn: {
    flex: 1,
    backgroundColor: "#5b9b9b",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  pickedBtn: {
    flex: 1,
    backgroundColor: "#5bad27",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    paddingLeft: 10,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: 12,
    paddingRight: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    gap: 10,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#e5e5ea",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,0,0,0.87)",
  },
  subText: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: "#c7c7cc",
  },
});
