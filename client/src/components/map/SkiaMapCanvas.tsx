// client/src/components/map/SkiaMapCanvas.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Rect,
  Text as SkiaText,
  matchFont,
} from "@shopify/react-native-skia";
import {
  Platform,
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import type { LayoutBundle, RouteResponse } from "@/types";
import { toScreen2D, toScreen3D } from "@/utils/projection";
import { useGroceryListStore } from "@/stores/useGroceryListStore";
import RouteOverlay from "./RouteOverlay";
import WaypointBadge from "./WaypointBadge";
import { colors } from "@/theme/tokens";

const shelfFont =
  Platform.OS !== "web"
    ? matchFont({
        fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
        fontSize: 10,
        fontWeight: "700",
      })
    : null;

const SHELF_WIDTH_BOOST = 1.45;
const SHELF_HEIGHT_BOOST = 1.6;
const SHELF_MIN_WIDTH = 34;
const SHELF_MIN_HEIGHT = 14;

function fitLabelToWidth(label: string, maxWidth: number) {
  if (!shelfFont || maxWidth <= 0) return "";
  if (shelfFont.measureText(label).width <= maxWidth) return label;
  const ellipsis = "...";
  if (shelfFont.measureText(ellipsis).width > maxWidth) return "";

  let output = label;
  while (output.length > 0) {
    const candidate = `${output}${ellipsis}`;
    if (shelfFont.measureText(candidate).width <= maxWidth) return candidate;
    output = output.slice(0, -1);
  }
  return "";
}

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
  const cartItems = useGroceryListStore((state) => state.items);
  const initialZoom = 1;
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(initialZoom);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const savedPanRef = useRef({ x: 0, y: 0 });
  const savedZoomRef = useRef(initialZoom);
  const livePanRef = useRef({ x: 0, y: 0 });
  const liveZoomRef = useRef(initialZoom);

  useEffect(() => {
    livePanRef.current = { x: panX, y: panY };
  }, [panX, panY]);

  useEffect(() => {
    liveZoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    // On first layout load (and when layout changes), fit full floorplan in view.
    setPanX(0);
    setPanY(0);
    setZoom(1);
    savedPanRef.current = { x: 0, y: 0 };
    savedZoomRef.current = 1;
    livePanRef.current = { x: 0, y: 0 };
    liveZoomRef.current = 1;
  }, [layout.id]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
          savedPanRef.current = {
            x: livePanRef.current.x,
            y: livePanRef.current.y,
          };
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
          savedZoomRef.current = liveZoomRef.current;
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

  const shelfRects = shelves
    .filter(
      (shelf) =>
        shelf.x != null &&
        shelf.y != null &&
        shelf.width != null &&
        shelf.height != null,
    )
    .map((shelf) => {
      const { sx, sy } = project(shelf.x as number, shelf.y as number);
      const w = Math.max(
        (shelf.width as number) * scale2D * SHELF_WIDTH_BOOST,
        SHELF_MIN_WIDTH,
      );
      const h = Math.max(
        (shelf.height as number) * scale2D * SHELF_HEIGHT_BOOST,
        SHELF_MIN_HEIGHT,
      );
      return {
        shelfId: shelf.id,
        left: sx - w / 2,
        right: sx + w / 2,
        top: sy - h / 2,
        bottom: sy + h / 2,
      };
    });

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .maxDuration(250)
        .onEnd((e, success) => {
          if (!success) return;
          const hit = shelfRects.find(
            (rect) =>
              e.x >= rect.left &&
              e.x <= rect.right &&
              e.y >= rect.top &&
              e.y <= rect.bottom,
          );
          setSelectedShelfId(hit?.shelfId ?? null);
        }),
    [shelfRects],
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(combined, tapGesture),
    [combined, tapGesture],
  );

  const selectedShelf = selectedShelfId
    ? (shelves.find((shelf) => shelf.id === selectedShelfId) ?? null)
    : null;
  const selectedShelfProducts = useMemo(
    () =>
      selectedShelf
        ? bundle.products
            .filter((product) => product.shelf_id === selectedShelf.id)
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        : [],
    [bundle.products, selectedShelf],
  );

  const cartQtyByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product_id, (map.get(item.product_id) ?? 0) + 1);
    }
    return map;
  }, [cartItems]);

  const floorTopLeft = project(0, 0);
  const floorBottomRight = project(layout.width_m, layout.height_m);
  const floorX = Math.min(floorTopLeft.sx, floorBottomRight.sx);
  const floorY = Math.min(floorTopLeft.sy, floorBottomRight.sy);
  const floorW = Math.abs(floorBottomRight.sx - floorTopLeft.sx);
  const floorH = Math.abs(floorBottomRight.sy - floorTopLeft.sy);

  return (
    <>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
          {/* Floor fill */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            color={colors.bgLight}
          />

          {/* Supermarket boundary */}
          <RoundedRect
            x={floorX}
            y={floorY}
            width={floorW}
            height={floorH}
            r={6}
            color="#CBD5E1"
            style="stroke"
            strokeWidth={1.5}
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
            const w = Math.max(
              shelf.width * scale2D * SHELF_WIDTH_BOOST,
              SHELF_MIN_WIDTH,
            );
            const h = Math.max(
              shelf.height * scale2D * SHELF_HEIGHT_BOOST,
              SHELF_MIN_HEIGHT,
            );
            const shelfLabel = shelf.label ?? shelf.aisle ?? "";
            const labelText = fitLabelToWidth(shelfLabel, Math.max(0, w - 8));
            const labelWidth =
              labelText && shelfFont
                ? shelfFont.measureText(labelText).width
                : 0;
            const labelX = sx - labelWidth / 2;
            const labelY = sy + 3;
            const isSelected = selectedShelfId === shelf.id;
            return (
              <Group key={shelf.id}>
                <RoundedRect
                  x={sx - w / 2}
                  y={sy - h / 2}
                  width={w}
                  height={h}
                  r={3}
                  color={isSelected ? "#ECFDF5" : "#F8FAFC"}
                />
                <RoundedRect
                  x={sx - w / 2}
                  y={sy - h / 2}
                  width={w}
                  height={h}
                  r={3}
                  color={isSelected ? "#16A34A" : "#94A3B8"}
                  style="stroke"
                  strokeWidth={isSelected ? 2 : 1}
                />
                {labelText && shelfFont && (
                  <SkiaText
                    x={labelX}
                    y={labelY}
                    text={labelText}
                    font={shelfFont}
                    color={isSelected ? "#166534" : "#64748B"}
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
              const entryW = 56;
              const entryH = 18;
              const entryText = fitLabelToWidth(entryLabel, entryW - 8);
              const entryLabelWidth =
                entryText && shelfFont
                  ? shelfFont.measureText(entryText).width
                  : 0;
              return (
                <Group key={node.id}>
                  <RoundedRect
                    x={sx - entryW / 2}
                    y={sy - entryH / 2}
                    width={entryW}
                    height={entryH}
                    r={3}
                    color="#F8FAFC"
                  />
                  <RoundedRect
                    x={sx - entryW / 2}
                    y={sy - entryH / 2}
                    width={entryW}
                    height={entryH}
                    r={3}
                    color="#94A3B8"
                    style="stroke"
                    strokeWidth={1}
                  />
                  {entryText && shelfFont && (
                    <SkiaText
                      x={sx - entryLabelWidth / 2}
                      y={sy + 3}
                      text={entryText}
                      font={shelfFont}
                      color="#64748B"
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

      <Modal
        visible={!!selectedShelf}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedShelfId(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedShelfId(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {selectedShelf?.label ?? selectedShelf?.aisle ?? "Prateleira"}
              </Text>
              <View style={styles.modalSelectedBadge}>
                <Text style={styles.modalSelectedBadgeText}>Selecionada</Text>
              </View>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedShelfProducts.length}{" "}
              {selectedShelfProducts.length === 1 ? "item" : "itens"}
            </Text>

            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
            >
              {selectedShelfProducts.length === 0 ? (
                <Text style={styles.emptyInventoryText}>
                  Nenhum item cadastrado nesta prateleira.
                </Text>
              ) : (
                selectedShelfProducts.map((product) => (
                  <View key={product.id} style={styles.inventoryRow}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.inventoryImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.inventoryImage,
                          styles.inventoryImagePlaceholder,
                        ]}
                      >
                        <Text style={styles.inventoryImagePlaceholderText}>
                          IMG
                        </Text>
                      </View>
                    )}
                    <View style={styles.inventoryMeta}>
                      <View style={styles.inventoryNameRow}>
                        <Text style={styles.inventoryName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        {(cartQtyByProductId.get(product.id) ?? 0) > 0 && (
                          <View style={styles.inCartIndicator}>
                            <Text style={styles.inCartIcon}>🛒</Text>
                            <View style={styles.inCartQtyBadge}>
                              <Text style={styles.inCartQtyText}>
                                {cartQtyByProductId.get(product.id)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <Text style={styles.inventoryDetails} numberOfLines={1}>
                        {product.category ?? "Categoria não informada"}
                        {product.section_index != null
                          ? ` · Seção ${product.section_index + 1}`
                          : ""}
                      </Text>
                      <Text style={styles.inventoryDetails} numberOfLines={1}>
                        {product.brand ?? "Marca não informada"}
                      </Text>
                      <Text style={styles.inventoryDetails} numberOfLines={1}>
                        Estoque: {product.quantity} · SKU: {product.sku ?? "-"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setSelectedShelfId(null)}
            >
              <Text style={styles.modalCloseBtnText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.38)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  modalSelectedBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalSelectedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  modalList: {
    flexGrow: 0,
  },
  modalListContent: {
    gap: 10,
    paddingBottom: 8,
  },
  emptyInventoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 8,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
  },
  inventoryImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  inventoryImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryImagePlaceholderText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  inventoryMeta: {
    flex: 1,
    gap: 2,
  },
  inventoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inventoryName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  inCartIndicator: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  inCartIcon: {
    fontSize: 14,
  },
  inCartQtyBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06b6d4",
    borderWidth: 1,
    borderColor: colors.white,
  },
  inCartQtyText: {
    fontSize: 8,
    fontWeight: "900",
    color: colors.white,
  },
  inventoryDetails: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    marginTop: 6,
    backgroundColor: colors.brandDark,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
