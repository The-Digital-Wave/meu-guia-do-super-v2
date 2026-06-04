// client/src/utils/projection.ts

export interface ScreenPoint { sx: number; sy: number }

/**
 * 2D orthographic projection — maps layout metres to canvas pixels.
 */
export function toScreen2D(
  x: number,
  y: number,
  layoutW: number,
  layoutH: number,
  canvasW: number,
  canvasH: number,
  panX: number,
  panY: number,
  zoom: number,
): ScreenPoint {
  const scale = Math.min((canvasW * zoom) / layoutW, (canvasH * zoom) / layoutH);
  const offsetX = (canvasW - layoutW * scale) / 2;
  const offsetY = (canvasH - layoutH * scale) / 2;
  return {
    sx: x * scale + offsetX + panX,
    sy: y * scale + offsetY + panY,
  };
}

/**
 * 3D axonometric parallel projection — pitch 30°, yaw 45°.
 * Coordinates are relative to the user position (centred on user).
 *
 *   u = K * (cos45° * (X - Xu) - cos45° * (Y - Yu))
 *   v = K * (sin45° * sin30° * (X - Xu) + sin45° * sin30° * (Y - Yu))
 *   Z = 0 for floor-plane coordinates
 */
const COS45 = Math.cos(Math.PI / 4);
const SIN45 = Math.sin(Math.PI / 4);
const SIN30 = Math.sin(Math.PI / 6);

export function toScreen3D(
  x: number,
  y: number,
  userX: number,
  userY: number,
  canvasW: number,
  canvasH: number,
  zoom: number,
): ScreenPoint {
  const K = Math.min(canvasW, canvasH) * zoom * 0.5;
  const dx = x - userX;
  const dy = y - userY;
  const u = K * (COS45 * dx - COS45 * dy);
  const v = K * (SIN45 * SIN30 * dx + SIN45 * SIN30 * dy);
  return {
    sx: canvasW / 2 + u,
    sy: canvasH / 2 + v,
  };
}

/**
 * Returns pixels-per-metre scale for 2D mode (used for shelf rect sizing).
 */
export function metreToPixel2D(
  layoutW: number,
  layoutH: number,
  canvasW: number,
  canvasH: number,
  zoom: number,
): number {
  return Math.min((canvasW * zoom) / layoutW, (canvasH * zoom) / layoutH);
}
