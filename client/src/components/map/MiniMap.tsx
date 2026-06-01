import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import type { Node, Edge, Shelf, Layout } from "@/types";

interface Props {
  nodes: Node[];
  edges: Edge[];
  shelves: Shelf[];
  layout: Layout;
  currentWaypointNodeId: string | null;
  bearingDeg: number;
}

const MINI_SIZE = 120;

const MiniMap = React.memo(function MiniMap({
  nodes,
  edges,
  shelves,
  layout,
  currentWaypointNodeId,
  bearingDeg,
}: Props) {
  // Scale meters → pixels to fit into MINI_SIZE square
  const scale = useMemo(
    () =>
      Math.min(
        MINI_SIZE / (layout.width_m || 1),
        MINI_SIZE / (layout.height_m || 1)
      ),
    [layout.width_m, layout.height_m]
  );

  const toX = (x: number) => x * scale;
  const toY = (y: number) => y * scale;

  const canvasW = layout.width_m * scale;
  const canvasH = layout.height_m * scale;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const waypointNode = currentWaypointNodeId
    ? nodeMap.get(currentWaypointNodeId)
    : null;

  const rotateStr = bearingDeg !== 0
    ? `rotate(${-bearingDeg}, ${cx}, ${cy})`
    : undefined;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{
        width: MINI_SIZE,
        height: MINI_SIZE,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Svg width={MINI_SIZE} height={MINI_SIZE} viewBox={`0 0 ${canvasW} ${canvasH}`}>
        <G transform={rotateStr}>
          {/* Shelves */}
          {shelves.map((shelf) => {
            if (shelf.x == null || shelf.y == null || shelf.width == null || shelf.height == null) return null;
            return (
              <G key={shelf.id}>
                <Rect
                  x={toX(shelf.x)}
                  y={toY(shelf.y)}
                  width={shelf.width * scale}
                  height={shelf.height * scale}
                  fill={shelf.color}
                  fillOpacity={0.3}
                  stroke={shelf.color}
                  strokeWidth={1}
                />
                {shelf.label && (
                  <SvgText
                    x={toX(shelf.x) + (shelf.width * scale) / 2}
                    y={toY(shelf.y) + (shelf.height * scale) / 2 + 3}
                    textAnchor="middle"
                    fontSize={5}
                    fill="rgba(0,0,0,0.7)"
                    fontWeight="600"
                  >
                    {shelf.label}
                  </SvgText>
                )}
              </G>
            );
          })}

          {/* Edges */}
          {edges.map((edge) => {
            const from = nodeMap.get(edge.node_from_id);
            const to = nodeMap.get(edge.node_to_id);
            if (!from || !to) return null;
            return (
              <Line
                key={edge.id}
                x1={toX(from.x)}
                y1={toY(from.y)}
                x2={toX(to.x)}
                y2={toY(to.y)}
                stroke="#e0e0e0"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Waypoint highlight */}
          {waypointNode && (
            <Circle
              cx={toX(waypointNode.x)}
              cy={toY(waypointNode.y)}
              r={8}
              fill="#FFD700"
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </G>
      </Svg>
    </View>
  );
});

export default MiniMap;
