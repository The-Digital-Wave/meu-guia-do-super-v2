// client/src/components/map/SkiaMapCanvas.tsx
import { useState, useMemo, useRef } from "react";
import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Rect,
  Paint,
  Text as SkiaText,
  matchFont,
} from "@shopify/react-native-skia";
import { Platform } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import type { LayoutBundle, RouteResponse } from "@/types";
import { toScreen2D, toScreen3D } from "@/utils/projection";
import RouteOverlay from "./RouteOverlay";
import WaypointBadge from "./WaypointBadge";
import { colors } from "@/theme/tokens";

const shelfFont = Platform.OS !== "web"
  ? matchFont({ fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif", fontSize: 8, fontWeight: "400" })
  : null;

interface SkiaMapCanvasProps {
  bundle: LayoutBundle;
  route: RouteResponse | null;
  mode: "2d" | "3d";
  userPos: { x: number; y: number } | null;
  canvasWidth: number;
  canvasHeight: number;
  activeSegmentIndex?: number;
}

export default function SkiaMapCanvas({
  bundle,
  route,
  mode,
  userPos,
  canvasWidth,
  canvasHeight,
  activeSegmentIndex = 0,
}: SkiaMapCanvasProps) {
  const { layout, shelves, nodes } = bundle;
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const savedPanRef = useRef({ x: 0, y: 0 });
  const savedZoomRef = useRef(1);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
          savedPanRef.current = { x: panX, y: panY };
        })
        .onUpdate((e) => {
          setPanX(savedPanRef.current.x + e.translationX);
          setPanY(savedPanRef.current.y + e.translationY);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(() => {
          savedZoomRef.current = zoom;
        })
        .onUpdate((e) => {
          setZoom(Math.min(4, Math.max(0.5, savedZoomRef.current * e.scale)));
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const combined = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  function project(x: number, y: number) {
    const uX = userPos?.x ?? layout.width_m / 2;
    const uY = userPos?.y ?? layout.height_m / 2;
    return mode === "2d"
      ? toScreen2D(
          x,
          y,
          layout.width_m,
          layout.height_m,
          canvasWidth,
          canvasHeight,
          panX,
          panY,
          zoom,
        )
      : toScreen3D(x, y, uX, uY, canvasWidth, canvasHeight, zoom);
  }

  const scale2D = Math.min(
    (canvasWidth * zoom) / layout.width_m,
    (canvasHeight * zoom) / layout.height_m,
  );

  const userScreen = userPos ? project(userPos.x, userPos.y) : null;

  return (
    <GestureDetector gesture={combined}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Floor fill */}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          color={colors.bgLight}
        />

        {/* Shelves */}
        {shelves.map((shelf) => {
          if (
            shelf.x == null ||
            shelf.y == null ||
            shelf.width == null ||
            shelf.height == null
          )
            return null;
          const { sx, sy } = project(shelf.x, shelf.y);
          const w = shelf.width * scale2D;
          const h = shelf.height * scale2D;
          const shelfLabel = shelf.label ?? shelf.aisle ?? null;
          const labelWidth =
            shelfLabel && shelfFont
              ? shelfFont.measureText(shelfLabel).width
              : 0;
          const labelX = sx - labelWidth / 2;
          const labelY = sy + 3;
          return (
            <Group key={shelf.id}>
              <RoundedRect
                x={sx - w / 2}
                y={sy - h / 2}
                width={w}
                height={h}
                r={3}
              >
                <Paint color="#FFFFFF" />
                <Paint color="#94A3B8" style="stroke" strokeWidth={1} />
              </RoundedRect>
              {shelfLabel && shelfFont && (
                <SkiaText
                  x={labelX}
                  y={labelY}
                  text={shelfLabel}
                  font={shelfFont}
                  color="#64748B"
                />
              )}
            </Group>
          );
        })}

        {/* Entry nodes */}
        {nodes
          .filter((n) => n.node_type === "ENTRY")
          .map((node) => {
            const { sx, sy } = project(node.x, node.y);
            const entryLabel = "ENTRADA";
            const entryLabelWidth = shelfFont
              ? shelfFont.measureText(entryLabel).width
              : 0;
            return (
              <Group key={node.id}>
                <RoundedRect
                  x={sx - 20}
                  y={sy - 8}
                  width={40}
                  height={16}
                  r={4}
                >
                  <Paint color="#DCFCE7" />
                  <Paint color="#16A34A" style="stroke" strokeWidth={1} />
                </RoundedRect>
                {shelfFont && (
                  <SkiaText
                    x={sx - entryLabelWidth / 2}
                    y={sy + 4}
                    text={entryLabel}
                    font={shelfFont}
                    color="#15803D"
                  />
                )}
              </Group>
            );
          })}

        {/* Route overlay */}
        {route && (
          <RouteOverlay
            route={route}
            nodes={nodes}
            layoutW={layout.width_m}
            layoutH={layout.height_m}
            canvasW={canvasWidth}
            canvasH={canvasHeight}
            panX={panX}
            panY={panY}
            zoom={zoom}
            mode={mode}
            userX={userPos?.x ?? 0}
            userY={userPos?.y ?? 0}
          />
        )}

        {/* Waypoint badges */}
        {route?.segments.map((seg, i) => {
          if (seg.shelf_front_x == null || seg.shelf_front_y == null)
            return null;
          const { sx, sy } = project(seg.shelf_front_x, seg.shelf_front_y);
          return (
            <WaypointBadge
              key={i}
              x={sx}
              y={sy}
              index={i + 1}
              isTarget={i === activeSegmentIndex}
            />
          );
        })}

        {/* User dot */}
        {userScreen && (
          <Group>
            <Circle
              cx={userScreen.sx}
              cy={userScreen.sy}
              r={10}
              color="rgba(59,130,246,0.2)"
            />
            <Circle
              cx={userScreen.sx}
              cy={userScreen.sy}
              r={6}
              color={colors.userDot}
            />
            <Circle
              cx={userScreen.sx}
              cy={userScreen.sy}
              r={2}
              color={colors.white}
            />
          </Group>
        )}
      </Canvas>
    </GestureDetector>
  );
}
