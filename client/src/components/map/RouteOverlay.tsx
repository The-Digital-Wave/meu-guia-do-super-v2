// client/src/components/map/RouteOverlay.tsx
import { Path, Skia } from "@shopify/react-native-skia";
import type { RouteResponse, Node } from "@/types";
import { toScreen2D, toScreen3D, type ScreenPoint } from "@/utils/projection";
import { colors } from "@/theme/tokens";

interface RouteOverlayProps {
  route: RouteResponse;
  nodes: Node[];
  layoutW: number;
  layoutH: number;
  canvasW: number;
  canvasH: number;
  panX: number;
  panY: number;
  zoom: number;
  mode: "2d" | "3d";
  userX: number;
  userY: number;
}

function project(
  x: number, y: number, mode: "2d" | "3d",
  lW: number, lH: number, cW: number, cH: number,
  panX: number, panY: number, zoom: number, uX: number, uY: number,
): ScreenPoint {
  return mode === "2d"
    ? toScreen2D(x, y, lW, lH, cW, cH, panX, panY, zoom)
    : toScreen3D(x, y, uX, uY, cW, cH, zoom);
}

export default function RouteOverlay({
  route, nodes, layoutW, layoutH, canvasW, canvasH, panX, panY, zoom, mode, userX, userY,
}: RouteOverlayProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const path = Skia.Path.Make();
  let firstPoint = true;

  for (const segment of route.segments) {
    for (const nodeId of segment.path_nodes) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      const { sx, sy } = project(node.x, node.y, mode, layoutW, layoutH, canvasW, canvasH, panX, panY, zoom, userX, userY);
      if (firstPoint) {
        path.moveTo(sx, sy);
        firstPoint = false;
      } else {
        path.lineTo(sx, sy);
      }
    }
  }

  return (
    <Path path={path} color={colors.routeActive} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" />
  );
}
