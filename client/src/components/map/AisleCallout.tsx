// client/src/components/map/AisleCallout.tsx
import { Group, RoundedRect, Circle, Path, Skia } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

interface AisleCalloutProps {
  x: number;
  y: number;
  label: string;
  itemCount: number;
}

const W = 140;
const H = 36;
const R = 6;

export default function AisleCallout({ x, y }: AisleCalloutProps) {
  const rectX = x - W / 2;
  const rectY = y - H - 10;

  // Triangle pointer pointing down from rect to shelf anchor
  const arrowPath = Skia.Path.Make();
  arrowPath.moveTo(x - 6, rectY + H);
  arrowPath.lineTo(x + 6, rectY + H);
  arrowPath.lineTo(x, rectY + H + 6);
  arrowPath.close();

  return (
    <Group>
      <RoundedRect x={rectX} y={rectY} width={W} height={H} r={R} color={colors.brandDark} />
      <Path path={arrowPath} color={colors.brandDark} />
      <Circle cx={rectX + 16} cy={rectY + H / 2} r={8} color={colors.brandVibrant} />
      <Circle cx={rectX + 16} cy={rectY + H / 2} r={2} color={colors.brandDark} />
    </Group>
  );
}
