// client/src/components/map/WaypointBadge.tsx
import { Circle, Group } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

interface WaypointBadgeProps {
  x: number;
  y: number;
  index: number;
  isTarget: boolean;
}

export default function WaypointBadge({ x, y, isTarget }: WaypointBadgeProps) {
  const fillColor = isTarget ? colors.waypointTarget : colors.routeActive;

  return (
    <Group>
      {isTarget && (
        <Circle cx={x} cy={y} r={16} color="transparent" style="stroke" strokeWidth={2.5} />
      )}
      <Circle cx={x} cy={y} r={8} color={fillColor} />
      <Circle cx={x} cy={y} r={3} color={colors.white} />
    </Group>
  );
}
