import React, { useCallback } from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import type { RouteSegment } from "@/types";

// Design tokens
const T = {
  white:         "#ffffff",
  greenAccent:   "#00754A",
  starbucksGreen:"#006241",
  greenLight:    "#d4e9e2",
  neutralWarm:   "#f2f0eb",
  textBlack:     "rgba(0,0,0,0.87)",
  textBlackSoft: "rgba(0,0,0,0.58)",
  fontPrimary:   "Inter_400Regular",
  fontSemibold:  "Inter_600SemiBold",
  space2: 8,
  space3: 16,
  space4: 24,
  radiusCard: 12,
  shadowNav: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius:  3,
    elevation:     4,
  },
};

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.round(s / 60)} min`;
}

interface StepItemProps {
  segment:   RouteSegment;
  index:     number;
  isActive:  boolean;
  isLast:    boolean;
  onPress:   (index: number) => void;
}

function StepItem({ segment, index, isActive, isLast, onPress }: StepItemProps) {
  const label = segment.product_id
    ? `Pegar item ${index + 1}`
    : `Avançar ${segment.distance_m.toFixed(1)}m`;

  return (
    <Pressable
      onPress={() => onPress(index)}
      style={({ pressed }) => ({
        flexDirection:    "row",
        alignItems:       "center",
        minHeight:        56,  // ≥44px touch target
        paddingHorizontal: T.space3,
        paddingVertical:  T.space2,
        backgroundColor:  pressed
          ? T.neutralWarm
          : isActive
            ? T.greenLight
            : T.white,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: T.neutralWarm,
      })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Step number badge */}
      <View
        style={{
          width:           28,
          height:          28,
          borderRadius:    14,
          backgroundColor: isActive ? T.greenAccent : T.neutralWarm,
          alignItems:      "center",
          justifyContent:  "center",
          marginRight:     T.space2,
          flexShrink:      0,
        }}
      >
        <Text
          style={{
            fontFamily: T.fontSemibold,
            fontSize:   13,
            color:      isActive ? "#ffffff" : T.textBlackSoft,
            lineHeight: 16,
          }}
        >
          {index + 1}
        </Text>
      </View>

      {/* Step description */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: T.fontSemibold,
            fontSize:   14,
            color:      isActive ? T.starbucksGreen : T.textBlack,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: T.fontPrimary,
            fontSize:   12,
            color:      T.textBlackSoft,
            marginTop:  2,
          }}
        >
          {segment.distance_m.toFixed(1)}m · {formatSeconds(segment.estimated_seconds)}
        </Text>
      </View>

      {/* Active indicator */}
      {isActive && (
        <View
          style={{
            width:        8,
            height:       8,
            borderRadius: 4,
            backgroundColor: T.greenAccent,
            flexShrink:   0,
          }}
        />
      )}
    </Pressable>
  );
}

interface Props {
  segments:       RouteSegment[];
  activeStepIndex: number;
  onStepPress:    (index: number) => void;
}

export default function WayfindingStepList({ segments, activeStepIndex, onStepPress }: Props) {
  const renderItem = useCallback(
    ({ item, index }: { item: RouteSegment; index: number }) => (
      <StepItem
        segment={item}
        index={index}
        isActive={index === activeStepIndex}
        isLast={index === segments.length - 1}
        onPress={onStepPress}
      />
    ),
    [activeStepIndex, segments.length, onStepPress],
  );

  return (
    <View
      style={{
        backgroundColor: T.white,
        borderTopLeftRadius:  T.radiusCard,
        borderTopRightRadius: T.radiusCard,
        maxHeight: 260,
        ...T.shadowNav,
      }}
    >
      {/* Handle */}
      <View style={{ alignItems: "center", paddingTop: T.space2 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: T.neutralWarm }} />
      </View>

      {/* Section header */}
      <View style={{ paddingHorizontal: T.space3, paddingVertical: T.space2 }}>
        <Text
          style={{
            fontFamily:    T.fontPrimary,
            fontSize:      11,
            color:         T.textBlackSoft,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {segments.length} {segments.length === 1 ? "passo" : "passos"} no percurso
        </Text>
      </View>

      {/* Step list — FlatList only, never ScrollView */}
      <FlatList
        data={segments}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
      />
    </View>
  );
}
