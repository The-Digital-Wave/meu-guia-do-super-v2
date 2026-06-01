import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

// Design tokens
const T = {
  greenAccent: "#00754A",
  white:       "#ffffff",
  fontSemibold: "Inter_600SemiBold",
  shadowFrap: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius:  12,
    elevation:     8,
  },
  space3: 16,
  space8: 56,  // FAB size per design spec
  buttonActiveScale: 0.95,
};

interface Props {
  onPress:    () => void;
  isLoading?: boolean;
  disabled?:  boolean;
  label?:     string;
}

export default function WayfindingFAB({
  onPress,
  isLoading = false,
  disabled  = false,
  label     = "Ir",
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => ({
        width:           T.space8,
        height:          T.space8,
        borderRadius:    T.space8 / 2,
        backgroundColor: T.greenAccent,
        alignItems:      "center",
        justifyContent:  "center",
        opacity:         disabled ? 0.5 : 1,
        transform:       [{ scale: pressed ? T.buttonActiveScale : 1 }],
        ...T.shadowFrap,
      })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={T.white} />
      ) : (
        <Text
          style={{
            fontFamily: T.fontSemibold,
            fontSize:   14,
            color:      T.white,
            textAlign:  "center",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
