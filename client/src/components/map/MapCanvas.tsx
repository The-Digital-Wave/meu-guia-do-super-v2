import React, { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Circle, Line, G, Text as SvgText } from "react-native-svg";
import type { Node, Edge } from "@/types";

interface Props {
  nodes: Node[];
  edges: Edge[];
  layoutWidthM: number;
  layoutHeightM: number;
  userNodeId: string | null;
  highlightedNodeIds?: string[]; // waypoint path nodes
  onNodeTap: (node: Node) => void;
}

// Node type colors
const NODE_COLORS: Record<string, string> = {
  INTERSECTION: "#d6dbde",
  SHELF_FRONT: "#00754A",
  ENTRY: "#006241",
  EXIT: "#c82014",
};

export default function MapCanvas({
  nodes,
  edges,
  layoutWidthM,
  layoutHeightM,
  userNodeId,
  highlightedNodeIds = [],
  onNodeTap,
}: Props) {
  const PADDING = 24;
  const screenWidth = Dimensions.get("window").width - PADDING * 2;

  // Scale meters → pixels, maintaining aspect ratio
  const scale = Math.min(
    screenWidth / layoutWidthM,
    (screenWidth * 0.75) / layoutHeightM
  );
  const canvasWidth = layoutWidthM * scale;
  const canvasHeight = layoutHeightM * scale;

  // Build a node map for quick lookup
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const highlightSet = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds]
  );

  // Convert meter coords to canvas pixel coords
  const toCanvasX = (x: number) => x * scale;
  const toCanvasY = (y: number) => y * scale;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ backgroundColor: "#f9f9f9", borderRadius: 8 }}
      >
        {/* Edges */}
        {edges.map((edge) => {
          const from = nodeMap.get(edge.node_from_id);
          const to = nodeMap.get(edge.node_to_id);
          if (!from || !to) return null;
          const isHighlighted =
            highlightSet.has(edge.node_from_id) && highlightSet.has(edge.node_to_id);
          return (
            <Line
              key={edge.id}
              x1={toCanvasX(from.x)}
              y1={toCanvasY(from.y)}
              x2={toCanvasX(to.x)}
              y2={toCanvasY(to.y)}
              stroke={isHighlighted ? "#00754A" : "#e0e0e0"}
              strokeWidth={isHighlighted ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const cx = toCanvasX(node.x);
          const cy = toCanvasY(node.y);
          const isUser = node.id === userNodeId;
          const isHighlighted = highlightSet.has(node.id);
          const baseColor = NODE_COLORS[node.node_type] ?? "#999";
          return (
            <G key={node.id}>
              {/* Tap target (transparent, larger than visual) */}
              <Circle
                cx={cx}
                cy={cy}
                r={18}
                fill="transparent"
                onPress={() => onNodeTap(node)}
              />
              {/* Visual dot */}
              <Circle
                cx={cx}
                cy={cy}
                r={isUser ? 10 : isHighlighted ? 7 : 5}
                fill={isUser ? "#00754A" : isHighlighted ? "#00754A" : baseColor}
                stroke={isUser ? "#ffffff" : "none"}
                strokeWidth={isUser ? 2 : 0}
              />
              {/* User pulse ring */}
              {isUser && (
                <Circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="none"
                  stroke="#00754A"
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}
              {/* Label for ENTRY/EXIT/SHELF_FRONT */}
              {(node.node_type === "ENTRY" || node.node_type === "EXIT") && node.label ? (
                <SvgText
                  x={cx}
                  y={cy - 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#006241"
                  fontWeight="600"
                >
                  {node.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", marginTop: 8, gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { color: "#00754A", label: "Prateleira" },
          { color: "#d6dbde", label: "Corredor" },
          { color: "#006241", label: "Entrada" },
        ].map(({ color, label }) => (
          <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 11, color: "rgba(0,0,0,0.58)", fontFamily: "Inter_400Regular" }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
