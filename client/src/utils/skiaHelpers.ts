// client/src/utils/skiaHelpers.ts
import { Skia } from "@shopify/react-native-skia";
import { colors } from "@/theme/tokens";

export function makeRoutePaint() {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.routeActive));
  paint.setStrokeWidth(4);
  paint.setStyle(1); // stroke
  paint.setStrokeCap(1); // round
  paint.setStrokeJoin(1); // round
  return paint;
}

export function makeUserDotPaint() {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.userDot));
  return paint;
}

export function makeShelfStrokePaint() {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colors.border));
  paint.setStrokeWidth(1);
  paint.setStyle(1); // stroke
  return paint;
}
