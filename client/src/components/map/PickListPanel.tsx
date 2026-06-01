import React, { useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import type { RouteSegment } from "@/types";
import PickListItem from "./PickListItem";

interface Props {
  segments: RouteSegment[];
  activeIndex: number;
  collectedIndices: number[];
  onCollect: (index: number) => void;
  onSkip: (index: number) => void;
  onStartNavigation: () => void;
  totalDistanceM: number;
  totalSeconds: number;
}

function formatMinutes(seconds: number): string {
  if (seconds < 60) return "<1";
  return `${Math.round(seconds / 60)}`;
}

type SegmentRow = { index: number; segment: RouteSegment };

export default function PickListPanel({
  segments,
  activeIndex,
  collectedIndices,
  onCollect,
  onSkip,
  onStartNavigation,
  totalDistanceM,
  totalSeconds,
}: Props) {
  const totalStops = segments.length;
  const collectedSet = new Set(collectedIndices);

  // Build ordered list: collected first, then active, then upcoming
  const collected: SegmentRow[] = [];
  const active: SegmentRow[] = [];
  const upcoming: SegmentRow[] = [];

  segments.forEach((segment, index) => {
    if (collectedSet.has(index)) {
      collected.push({ index, segment });
    } else if (index === activeIndex) {
      active.push({ index, segment });
    } else {
      upcoming.push({ index, segment });
    }
  });

  const orderedRows: SegmentRow[] = [...collected, ...active, ...upcoming];

  const keyExtractor = useCallback(
    (item: SegmentRow) => `seg-${item.index}`,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: SegmentRow }) => {
      const { index, segment } = item;
      const isActive = index === activeIndex && !collectedSet.has(index);
      const isCollected = collectedSet.has(index);
      return (
        <PickListItem
          number={index + 1}
          productName={segment.product_name ?? `Parada ${index + 1}`}
          shelfLabel={segment.shelf_label}
          distanceM={segment.distance_m}
          isActive={isActive}
          isCollected={isCollected}
          onCollect={() => onCollect(index)}
          onSkip={() => onSkip(index)}
        />
      );
    },
    [activeIndex, collectedSet, onCollect, onSkip]
  );

  const summaryText = `Parada ${activeIndex + 1} de ${totalStops} · ${totalDistanceM.toFixed(0)}m · ~${formatMinutes(totalSeconds)}min`;

  return (
    <View style={styles.panel}>
      {/* Drag handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Summary row */}
      <Text style={styles.summary}>{summaryText}</Text>

      {/* Pick list */}
      <FlatList
        data={orderedRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        style={styles.list}
      />

      {/* CTA */}
      <Pressable
        onPress={onStartNavigation}
        style={({ pressed }) => [
          styles.cta,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Iniciar navegação →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: "50%",
  },
  handleContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  summary: {
    fontSize: 13,
    color: "#555555",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flexShrink: 1,
  },
  cta: {
    backgroundColor: "#00754A",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  ctaText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
