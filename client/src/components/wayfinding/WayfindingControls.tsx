import React from "react";
import { View, Pressable, Text } from "react-native";

// Design tokens
const T = {
  white:       "#ffffff",
  greenAccent: "#00754A",
  textBlackSoft: "rgba(0,0,0,0.58)",
  shadowNav: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius:  3,
    elevation:     4,
  },
  radiusCircle: 9999,
  space2: 8,
  space3: 16,
};

// Minimum 44×44px touch target per WCAG 2.2 AA
const CONTROL_SIZE = 44;

interface Props {
  onZoomIn:   () => void;
  onZoomOut:  () => void;
  onRecenter: () => void;
}

function ControlButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width:           CONTROL_SIZE,
        height:          CONTROL_SIZE,
        borderRadius:    T.radiusCircle,
        backgroundColor: T.white,
        alignItems:      "center",
        justifyContent:  "center",
        opacity:         pressed ? 0.8 : 1,
        ...T.shadowNav,
        ...style,
      })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 20, color: T.greenAccent, lineHeight: 22 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// MappedIn benchmark: controls stack vertically, bottom-right, 16px from edges
export default function WayfindingControls({ onZoomIn, onZoomOut, onRecenter }: Props) {
  return (
    <View
      style={{
        position:       "absolute",
        right:          T.space3,
        bottom:         T.space3,
        alignItems:     "center",
        gap:            T.space2,
      }}
    >
      <ControlButton label="+" onPress={onZoomIn}  />
      <ControlButton label="−" onPress={onZoomOut} />
      <ControlButton label="⊙" onPress={onRecenter} />
    </View>
  );
}
