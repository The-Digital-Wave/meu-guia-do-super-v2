import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, Dimensions, Animated, Easing } from "react-native";
import Svg, { Circle, Line, G, Text as SvgText, Rect, Polyline } from "react-native-svg";
import type { Node, Edge, Shelf } from "@/types";

interface ProductPin {
  nodeId: string;
  number: number;
  x: number;
  y: number;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
  layoutWidthM: number;
  layoutHeightM: number;
  userNodeId: string | null;
  highlightedNodeIds?: string[];
  onNodeTap: (node: Node) => void;
  // Phase 7 additions (all optional)
  shelves?: Shelf[];
  productPins?: ProductPin[];
  bearingDeg?: number;
  tiltEnabled?: boolean;
  highlightNodeId?: string;
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
  shelves = [],
  productPins = [],
  bearingDeg = 0,
  tiltEnabled = false,
  highlightNodeId,
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

  // User node SVG coords (for rotation center)
  const userNode = userNodeId ? nodeMap.get(userNodeId) : null;
  const userSvgX = userNode ? toCanvasX(userNode.x) : canvasWidth / 2;
  const userSvgY = userNode ? toCanvasY(userNode.y) : canvasHeight / 2;

  // Bearing rotation animation
  const bearingAnim = useRef(new Animated.Value(bearingDeg)).current;
  const prevBearingRef = useRef(bearingDeg);

  useEffect(() => {
    if (prevBearingRef.current !== bearingDeg) {
      prevBearingRef.current = bearingDeg;
      Animated.timing(bearingAnim, {
        toValue: bearingDeg,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [bearingDeg, bearingAnim]);

  // Tilt animation
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tiltAnim, {
      toValue: tiltEnabled ? 1 : 0,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [tiltEnabled, tiltAnim]);

  const rotateXInterp = tiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "30deg"],
  });

  // Route polyline points string
  const routePoints = useMemo(() => {
    if (highlightedNodeIds.length < 2) return "";
    const coords: string[] = [];
    for (const nodeId of highlightedNodeIds) {
      const n = nodeMap.get(nodeId);
      if (n) coords.push(`${toCanvasX(n.x)},${toCanvasY(n.y)}`);
    }
    return coords.join(" ");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedNodeIds, nodeMap, scale]);

  // Bearing rotation transform string (non-animated; SVG G transform)
  // We use a static string since SVG G transform can't be animated via Animated API directly
  const rotateTransform = bearingDeg !== 0
    ? `rotate(${-bearingDeg}, ${userSvgX}, ${userSvgY})`
    : undefined;

  const containerStyle = {
    perspective: 500,
    transform: [{ rotateX: rotateXInterp }] as any,
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View style={tiltEnabled ? containerStyle : undefined}>
        <Svg
          width={canvasWidth}
          height={canvasHeight}
          style={{ backgroundColor: "#f9f9f9", borderRadius: 8 }}
        >
          <G transform={rotateTransform}>
            {/* Shelves (lowest z-layer) */}
            {shelves.map((shelf) => {
              if (shelf.x == null || shelf.y == null || shelf.width == null || shelf.height == null) return null;
              return (
                <G key={shelf.id}>
                  <Rect
                    x={toCanvasX(shelf.x)}
                    y={toCanvasY(shelf.y)}
                    width={shelf.width * scale}
                    height={shelf.height * scale}
                    fill={shelf.color}
                    fillOpacity={0.3}
                    stroke={shelf.color}
                    strokeWidth={1.5}
                  />
                  {shelf.label && (
                    <SvgText
                      x={toCanvasX(shelf.x) + (shelf.width * scale) / 2}
                      y={toCanvasY(shelf.y) + (shelf.height * scale) / 2 + 4}
                      textAnchor="middle"
                      fontSize={8}
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
              const isHighlighted =
                highlightSet.has(edge.node_from_id) && highlightSet.has(edge.node_to_id);
              return (
                <Line
                  key={edge.id}
                  x1={toCanvasX(from.x)}
                  y1={toCanvasY(from.y)}
                  x2={toCanvasX(to.x)}
                  y2={toCanvasY(to.y)}
                  stroke={isHighlighted ? "#90d030" : "#e0e0e0"}
                  strokeWidth={isHighlighted ? 4 : 1.5}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Route polyline */}
            {routePoints ? (
              <Polyline
                points={routePoints}
                stroke="#90d030"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}

            {/* Nodes */}
            {nodes.map((node) => {
              const cx = toCanvasX(node.x);
              const cy = toCanvasY(node.y);
              const isUser = node.id === userNodeId;
              const isHighlighted = highlightSet.has(node.id);
              const isHighlightNode = node.id === highlightNodeId;
              const baseColor = NODE_COLORS[node.node_type] ?? "#999";
              const nodeColor = isHighlightNode ? "#FFD700" : (isUser ? "#00754A" : isHighlighted ? "#00754A" : baseColor);
              return (
                <G key={node.id}>
                  {/* Tap target (transparent, larger than visual) */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={22}
                    fill="transparent"
                    onPress={() => onNodeTap(node)}
                  />
                  {/* Visual dot */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={isUser ? 10 : isHighlighted ? 7 : 5}
                    fill={nodeColor}
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
                  {/* Highlight ring for MiniMap waypoint */}
                  {isHighlightNode && !isUser && (
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth={2}
                    />
                  )}
                  {/* Label for ENTRY/EXIT */}
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

            {/* Product pins (above nodes) */}
            {productPins.map((pin) => {
              const px = toCanvasX(pin.x);
              const py = toCanvasY(pin.y);
              return (
                <G
                  key={`pin-${pin.nodeId}-${pin.number}`}
                  accessible={true}
                  accessibilityLabel={`Parada ${pin.number}`}
                >
                  <Circle
                    cx={px}
                    cy={py}
                    r={14}
                    fill="#00754A"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={px}
                    y={py + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#ffffff"
                    fontWeight="700"
                  >
                    {pin.number}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </Animated.View>

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
