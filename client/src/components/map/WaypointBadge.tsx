// client/src/components/map/WaypointBadge.tsx
import { Circle, Group, Text as SkiaText, matchFont } from "@shopify/react-native-skia";
import { Platform } from "react-native";
import { colors } from "@/theme/tokens";

interface WaypointBadgeProps {
  x: number;
  y: number;
  index: number;
  isTarget: boolean;
}

const waypointFont =
  Platform.OS !== "web"
    ? matchFont({
        fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
        fontSize: 10,
        fontWeight: "700",
      })
    : null;

export default function WaypointBadge({ x, y, index, isTarget }: WaypointBadgeProps) {
  const fillColor = isTarget ? colors.waypointTarget : colors.routeActive;
  const label = String(index);
  const labelWidth = waypointFont ? waypointFont.measureText(label).width : 0;

  return (
    <Group>
      {isTarget && (
        <Circle cx={x} cy={y} r={18} color="transparent" style="stroke" strokeWidth={2.5} />
      )}
      <Circle cx={x} cy={y} r={11} color={fillColor} />
      {waypointFont && (
        <SkiaText
          x={x - labelWidth / 2}
          y={y + 3.5}
          text={label}
          font={waypointFont}
          color={colors.white}
        />
      )}
    </Group>
  );
}
