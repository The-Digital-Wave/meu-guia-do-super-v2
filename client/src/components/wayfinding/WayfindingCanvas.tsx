import React, { useMemo, useRef, useState } from "react";
import { View, Dimensions, GestureResponderEvent } from "react-native";
import Svg, { Circle, Line, G, Text as SvgText } from "react-native-svg";
import type { Node, Edge } from "@/types";

// Design tokens
const T = {
  neutralWarm:  "#f2f0eb",
  greenAccent:  "#00754A",
  starbucksGreen: "#006241",
  error:        "#c82014",
  inputBorder:  "#d6dbde",
  neutralCool:  "#f9f9f9",
};

const NODE_COLOR: Record<string, string> = {
  INTERSECTION: T.inputBorder,
  SHELF_FRONT:  T.greenAccent,
  ENTRY:        T.starbucksGreen,
  EXIT:         T.error,
};

interface Props {
  nodes: Node[];
  edges: Edge[];
  layoutWidthM: number;
  layoutHeightM: number;
  userNodeId: string | null;
  highlightedNodeIds?: string[];
  zoomScale?: number;
  onNodeTap: (node: Node) => void;
}

export default function WayfindingCanvas({
  nodes,
  edges,
  layoutWidthM,
  layoutHeightM,
  userNodeId,
  highlightedNodeIds = [],
  zoomScale = 1,
  onNodeTap,
}: Props) {
  const PADDING = 24;
  const screenWidth = Dimensions.get("window").width - PADDING * 2;

  const baseScale = Math.min(
    screenWidth / layoutWidthM,
    (screenWidth * 0.75) / layoutHeightM,
  );
  const scale = baseScale * zoomScale;

  const canvasWidth  = layoutWidthM  * scale;
  const canvasHeight = layoutHeightM * scale;

  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const highlightSet = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds],
  );

  const toX = (x: number) => x * scale;
  const toY = (y: number) => y * scale;

  return (
    <View style={{ alignItems: "center", backgroundColor: T.neutralWarm, borderRadius: 12 }}>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ backgroundColor: T.neutralWarm, borderRadius: 12 }}
      >
        {/* Edges */}
        {edges.map((edge) => {
          const from = nodeMap.get(edge.node_from_id);
          const to   = nodeMap.get(edge.node_to_id);
          if (!from || !to) return null;
          const isHighlighted =
            highlightSet.has(edge.node_from_id) && highlightSet.has(edge.node_to_id);
          return (
            <Line
              key={edge.id}
              x1={toX(from.x)} y1={toY(from.y)}
              x2={toX(to.x)}   y2={toY(to.y)}
              stroke={isHighlighted ? T.greenAccent : "#e0e0e0"}
              strokeWidth={isHighlighted ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const cx = toX(node.x);
          const cy = toY(node.y);
          const isUser      = node.id === userNodeId;
          const isHighlight = highlightSet.has(node.id);
          const baseColor   = NODE_COLOR[node.node_type] ?? "#999";

          return (
            <G key={node.id}>
              {/* 44px tap target */}
              <Circle
                cx={cx} cy={cy} r={22}
                fill="transparent"
                onPress={() => onNodeTap(node)}
              />
              {/* Pulse ring for user position */}
              {isUser && (
                <Circle cx={cx} cy={cy} r={14}
                  fill="none"
                  stroke={T.greenAccent}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}
              {/* Visual dot */}
              <Circle
                cx={cx} cy={cy}
                r={isUser ? 10 : isHighlight ? 7 : 5}
                fill={isUser ? T.greenAccent : isHighlight ? T.greenAccent : baseColor}
                stroke={isUser ? "#ffffff" : "none"}
                strokeWidth={isUser ? 2 : 0}
              />
              {/* Labels for ENTRY / EXIT nodes */}
              {(node.node_type === "ENTRY" || node.node_type === "EXIT") && node.label ? (
                <SvgText
                  x={cx} y={cy - 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill={T.starbucksGreen}
                  fontWeight="600"
                >
                  {node.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
