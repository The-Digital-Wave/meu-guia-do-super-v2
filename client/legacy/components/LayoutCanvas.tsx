import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFullscreen } from "@reactuses/core";
import { Expand, LocateFixed, Minimize2, Minus, Plus } from "lucide-react";

import type { OptimizedRoute, Point, PreviewRoute, Shelf, Supermarket } from "../types/domain";

type LayoutCanvasProps = {
  supermarket?: Supermarket;
  currentPosition?: Point;
  previewRoute?: PreviewRoute;
  optimizedRoute?: OptimizedRoute;
  editable?: boolean;
  scale?: number;
  pseudoFullscreenToolbarStart?: ReactNode;
  pseudoFullscreenToolbarEnd?: ReactNode;
  onCurrentPositionChange?: (point: Point) => void;
  onShelfMove?: (shelf: Shelf, point: Point) => void;
};

// Sequential palette for multi-segment routes
const ROUTE_PALETTE = ["#2563EB", "#7C3AED", "#0891B2", "#D97706", "#DC2626", "#059669"];

export function LayoutCanvas({
  supermarket,
  currentPosition,
  previewRoute,
  optimizedRoute,
  editable = false,
  scale = 1,
  pseudoFullscreenToolbarStart,
  pseudoFullscreenToolbarEnd,
  onCurrentPositionChange,
  onShelfMove,
}: LayoutCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [draggingShelfId, setDraggingShelfId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [localScale, setLocalScale] = useState(1);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isNativeFullscreen, { enterFullscreen, exitFullscreen, isEnabled: isNativeFullscreenEnabled }] = useFullscreen(frameRef);

  const isFullscreen = isNativeFullscreen || isPseudoFullscreen;
  const pseudoFullscreenInsetStyle = isPseudoFullscreen
    ? {
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }
    : undefined;

  const combinedScale = Number((scale * localScale).toFixed(2));

  useEffect(() => {
    if (!isPseudoFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPseudoFullscreen]);

  const layout = supermarket?.layout;
  const shelves = layout?.shelves ?? [];

  const routeSegments = useMemo(() => {
    if (optimizedRoute?.segments?.length) {
      return optimizedRoute.segments.map((segment, index) => ({
        key: `${segment.productId}-${index}`,
        color: ROUTE_PALETTE[index % ROUTE_PALETTE.length],
        points: segment.points,
        label: `${index + 1}`,
      }));
    }

    if (previewRoute?.points?.length) {
      return [
        {
          key: previewRoute.target.productId,
          color: ROUTE_PALETTE[0],
          points: previewRoute.points,
          label: "1",
        },
      ];
    }

    return [];
  }, [optimizedRoute, previewRoute]);

  function resolvePoint(event: ReactMouseEvent<SVGElement>) {
    if (!layout || !svgRef.current) {
      return { x: 0, y: 0 };
    }

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * layout.width;
    const y = ((event.clientY - rect.top) / rect.height) * layout.height;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  }

  function handleZoomIn() {
    setLocalScale((value) => Math.min(2.5, Number((value + 0.1).toFixed(2))));
  }

  function handleZoomOut() {
    setLocalScale((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))));
  }

  function handleCenterGrid() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
    scroller.scrollTop = Math.max(0, (scroller.scrollHeight - scroller.clientHeight) / 2);
  }

  async function handleFullScreen() {
    if (isFullscreen) {
      if (isNativeFullscreen) {
        exitFullscreen();
      }
      setIsPseudoFullscreen(false);
      return;
    }

    if (isNativeFullscreenEnabled) {
      enterFullscreen();
      window.setTimeout(() => {
        if (!document.fullscreenElement) {
          setIsPseudoFullscreen(true);
        }
      }, 180);
    } else {
      setIsPseudoFullscreen(true);
    }
  }

  if (!layout) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Selecione um supermercado para carregar o layout.
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={`overflow-hidden border border-slate-200/80 bg-white shadow-[0_2px_20px_rgba(15,23,42,0.07)] ${
        isPseudoFullscreen ? "fixed inset-0 z-[9999] h-screen w-screen rounded-none" : "rounded-[20px]"
      }`}
      style={pseudoFullscreenInsetStyle}
    >
      <div className={`border-b border-slate-200/80 bg-slate-50/80 p-2 ${isPseudoFullscreen ? "grid grid-cols-3 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center" : "flex items-center justify-center"}`}>
        {isPseudoFullscreen ? <div className="min-w-0 sm:max-w-md">{pseudoFullscreenToolbarStart}</div> : null}

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleFullScreen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={handleCenterGrid}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
            title="Centralizar"
            aria-label="Center grid"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        {isPseudoFullscreen ? <div className="flex justify-end">{pseudoFullscreenToolbarEnd}</div> : null}
      </div>

      <div
        ref={scrollerRef}
        className="overflow-auto"
        style={isPseudoFullscreen ? { height: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 56px)" } : undefined}
      >
        <div style={{ transform: `scale(${combinedScale})`, transformOrigin: "top left", width: "100%" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{ display: "block", width: "100%" }}
            onClick={(event) => {
              if (!editable && onCurrentPositionChange) {
                onCurrentPositionChange(resolvePoint(event));
              }
            }}
            onMouseMove={(event) => {
              if (!editable || !draggingShelfId || !onShelfMove) {
                return;
              }

              const point = resolvePoint(event);
              const shelf = shelves.find((entry) => entry.id === draggingShelfId);
              if (!shelf) {
                return;
              }

              onShelfMove(shelf, {
                x: Math.max(0, point.x - dragOffset.x),
                y: Math.max(0, point.y - dragOffset.y),
              });
            }}
            onMouseUp={() => setDraggingShelfId(null)}
            onMouseLeave={() => setDraggingShelfId(null)}
          >
            <defs>
              {/* Drop shadow for shelf blocks */}
              <filter id="lc-shelf-shadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="0.6" stdDeviation="0.8" floodColor="#1E293B" floodOpacity="0.16" />
              </filter>

              {/* Dot-grid floor pattern */}
              <pattern id="lc-dot-grid" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="0.4" fill="rgba(100,116,139,0.22)" />
              </pattern>

              {/* Marching-ants route animation */}
              <style>{`
                .lc-route-march {
                  stroke-dasharray: 3.5 2.5;
                  animation: lc-march 1s linear infinite;
                }
                @keyframes lc-march {
                  from { stroke-dashoffset: 0; }
                  to   { stroke-dashoffset: -12; }
                }
              `}</style>
            </defs>

            {/* ── Floor ── */}
            <rect x="0" y="0" width={layout.width} height={layout.height} fill="#ECEEF3" />
            <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#lc-dot-grid)" />

            {/* ── Outer wall ── */}
            <rect
              x="0.5"
              y="0.5"
              width={layout.width - 1}
              height={layout.height - 1}
              rx="2.5"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="0.9"
            />

            {/* ── Shelves ── */}
            {shelves.map((shelf) => {
              const tooltip = shelf.placements.length
                ? shelf.placements.map((p) => `${p.product.name}: ${p.quantity}`).join(" | ")
                : "Sem estoque associado";

              return (
                <g key={shelf.id} filter="url(#lc-shelf-shadow)">
                  {/* Main body */}
                  <rect
                    x={shelf.x}
                    y={shelf.y}
                    width={shelf.width}
                    height={shelf.height}
                    rx="1.0"
                    fill={shelf.color}
                    onMouseDown={(event) => {
                      if (!editable) {
                        return;
                      }

                      setDraggingShelfId(shelf.id);
                      const point = resolvePoint(event);
                      setDragOffset({ x: point.x - shelf.x, y: point.y - shelf.y });
                    }}
                    style={{ cursor: editable ? "grab" : "default" }}
                  >
                    <title>{`${shelf.sectionName} | ${tooltip}`}</title>
                  </rect>

                  {/* Section label */}
                  <text
                    x={shelf.x + shelf.width / 2}
                    y={shelf.y + shelf.height / 2 + 0.5}
                    fontSize="2.6"
                    fontWeight="600"
                    fill="rgba(255,255,255,0.95)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: "none", letterSpacing: "0.04em", fontFamily: "system-ui, sans-serif" }}
                  >
                    {shelf.sectionName}
                  </text>
                </g>
              );
            })}

            {/* ── Route segments (drawn first) ── */}
            {routeSegments.map((segment) => {
              const ptStr = segment.points.map((p) => `${p.x},${p.y}`).join(" ");

              return (
                <g key={`${segment.key}-path`}>
                  {/* Wide translucent halo */}
                  <polyline
                    points={ptStr}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="2"
                    strokeOpacity="0.10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Animated marching-dashes */}
                  <polyline
                    points={ptStr}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="0.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lc-route-march"
                  />
                </g>
              );
            })}

            {/* ── Destination pins (drawn last, above all route lines) ── */}
            {routeSegments.map((segment) => {
              const dest = segment.points[segment.points.length - 1];

              if (!dest) {
                return null;
              }

              return (
                <g key={`${segment.key}-pin`}>
                  <circle cx={dest.x} cy={dest.y} r="3.2" fill={segment.color} fillOpacity="0.16" />
                  <circle cx={dest.x} cy={dest.y} r="2.2" fill={segment.color} stroke="white" strokeWidth="0.7" />
                  <text
                    x={dest.x}
                    y={dest.y + 0.5}
                    fontSize="1.9"
                    fontWeight="700"
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}

            {/* ── Entrance marker ── */}
            <circle cx={supermarket.entranceX} cy={supermarket.entranceY} r="2" fill="#10B981" />
            <circle cx={supermarket.entranceX} cy={supermarket.entranceY} r="2" fill="none" stroke="white" strokeWidth="0.6" />
            <text
              x={supermarket.entranceX + 3}
              y={supermarket.entranceY + 0.6}
              fontSize="2.2"
              fontWeight="700"
              fill="#065F46"
              style={{ pointerEvents: "none", letterSpacing: "0.08em", fontFamily: "system-ui, sans-serif" }}
            >
              ENTRADA
            </text>

            {/* ── Current-position blue dot ── */}
            {currentPosition && (
              <g>
                {/* Static accuracy ring */}
                <circle
                  cx={currentPosition.x}
                  cy={currentPosition.y}
                  r="5.5"
                  fill="#3B82F6"
                  fillOpacity="0.07"
                  stroke="#3B82F6"
                  strokeWidth="0.35"
                  strokeOpacity="0.25"
                />

                {/* Animated pulse ring */}
                <circle cx={currentPosition.x} cy={currentPosition.y} r="2.2" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeOpacity="0.7">
                  <animate attributeName="r" from="2.2" to="4.2" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Core dot */}
                <circle cx={currentPosition.x} cy={currentPosition.y} r="2.2" fill="#1D4ED8" />

                {/* White center */}
                <circle cx={currentPosition.x} cy={currentPosition.y} r="0.85" fill="white" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
