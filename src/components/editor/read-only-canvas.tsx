"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer as KonvaLayer, Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Minus,
  Plus,
  Maximize2,
} from "lucide-react";
import { LayerRenderer } from "@/components/editor/layer-renderer";
import type { Board, Layer, BoardItem } from "@/types/board";

interface ReadOnlyCanvasProps {
  board: Board;
  layers: Layer[];
  items: BoardItem[];
  /** Share token for proxied image loading. Omit for authenticated viewer mode
   *  where images are fetched directly from Appwrite (requires public permissions). */
  token?: string;
}

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 10;
const ZOOM_STEP = 1.15;
const noop = () => {};

export function ReadOnlyCanvas({
  board,
  layers,
  items,
  token,
}: ReadOnlyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Zoom + pan state (scale = absolute, x/y = stage offset in px)
  const [stageView, setStageView] = useState({ scale: 1, x: 0, y: 0 });

  // Layer/item visibility (client-side only — not persisted)
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());
  const [hiddenItemIds, setHiddenItemIds] = useState<Set<string>>(new Set());

  // Layer panel state
  const [panelOpen, setPanelOpen] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  // ── Container size tracking ──────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Fit-to-screen helper ─────────────────────────────────────────────────
  const getFitView = useCallback(
    (containerSize: { width: number; height: number }) => {
      const boardW = board.width || 1920;
      const boardH = board.height || 1080;
      const scale = Math.min(
        containerSize.width / boardW,
        containerSize.height / boardH,
        1,
      );
      return {
        scale,
        x: (containerSize.width - boardW * scale) / 2,
        y: (containerSize.height - boardH * scale) / 2,
      };
    },
    [board.width, board.height],
  );

  // Fit on initial size load
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      setStageView(getFitView(size));
    }
  }, [size, getFitView]);

  // ── Wheel zoom ───────────────────────────────────────────────────────────
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const oldScale = stageView.scale;
    const newScale = Math.min(Math.max(oldScale * factor, ZOOM_MIN), ZOOM_MAX);

    const mousePointTo = {
      x: (pointer.x - stageView.x) / oldScale,
      y: (pointer.y - stageView.y) / oldScale,
    };

    setStageView({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // ── Toolbar zoom controls ────────────────────────────────────────────────
  const zoomBy = (factor: number) => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const oldScale = stageView.scale;
    const newScale = Math.min(Math.max(oldScale * factor, ZOOM_MIN), ZOOM_MAX);
    const mousePointTo = {
      x: (cx - stageView.x) / oldScale,
      y: (cy - stageView.y) / oldScale,
    };
    setStageView({
      scale: newScale,
      x: cx - mousePointTo.x * newScale,
      y: cy - mousePointTo.y * newScale,
    });
  };

  // ── Asset proxy rewrite ──────────────────────────────────────────────────
  // Only rewrite image src when a share token is provided. In authenticated
  // viewer mode, images are publicly accessible via Appwrite directly.
  const proxiedItems: BoardItem[] = token
    ? items.map((item) => {
        if (item.type !== "image" || !item.contentJson) return item;
        try {
          const content = JSON.parse(item.contentJson);
          if (content.storageFileId) {
            content.src = `/api/share/${token}/asset/${content.storageFileId}`;
            return { ...item, contentJson: JSON.stringify(content) };
          }
        } catch {
          // ignore parse errors
        }
        return item;
      })
    : items;

  // ── Layer / item preparation ─────────────────────────────────────────────
  const sortedLayers = [...layers].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  const itemsByLayer: Record<string, BoardItem[]> = {};
  for (const item of proxiedItems) {
    if (!itemsByLayer[item.layerId]) itemsByLayer[item.layerId] = [];
    itemsByLayer[item.layerId].push(item);
  }

  // ── Toggle helpers ───────────────────────────────────────────────────────
  const toggleLayerVisibility = (layerId: string) => {
    setHiddenLayerIds((prev) => {
      const next = new Set(prev);
      next.has(layerId) ? next.delete(layerId) : next.add(layerId);
      return next;
    });
  };

  const toggleItemVisibility = (itemId: string) => {
    setHiddenItemIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      next.has(layerId) ? next.delete(layerId) : next.add(layerId);
      return next;
    });
  };

  const zoomPercent = Math.round(stageView.scale * 100);

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* ── Layer panel ─────────────────────────────────────────────────── */}
      <aside
        className={`
          shrink-0 flex flex-col border-r border-white/10 bg-(--navy-900)/90
          transition-all duration-200 overflow-hidden
          ${panelOpen ? "w-52" : "w-0"}
        `}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-(--gray-300) text-xs font-semibold uppercase tracking-wider">
            Layers
          </span>
          <button
            onClick={() => setPanelOpen(false)}
            className="text-(--gray-500) hover:text-(--gray-300) transition-colors"
            aria-label="Hide layers panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedLayers.map((layer) => {
            const layerHidden = hiddenLayerIds.has(layer.$id);
            const layerExpanded = expandedLayers.has(layer.$id);
            const layerItems = itemsByLayer[layer.$id] ?? [];

            return (
              <div key={layer.$id}>
                {/* Layer row */}
                <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 group">
                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleLayerExpanded(layer.$id)}
                    className="shrink-0 text-(--gray-500) hover:text-(--gray-300)"
                    aria-label={
                      layerExpanded ? "Collapse layer" : "Expand layer"
                    }
                  >
                    {layerExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {/* Layer name */}
                  <span
                    className={`flex-1 text-xs truncate ${
                      layerHidden
                        ? "text-(--gray-600) line-through"
                        : "text-(--gray-300)"
                    }`}
                  >
                    {layer.name}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleLayerVisibility(layer.$id)}
                    className="shrink-0 text-(--gray-500) hover:text-(--gray-300) opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={layerHidden ? "Show layer" : "Hide layer"}
                  >
                    {layerHidden ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Items list (when expanded) */}
                {layerExpanded && layerItems.length > 0 && (
                  <div className="pl-6">
                    {layerItems.map((item) => {
                      const itemHidden = hiddenItemIds.has(item.$id);
                      return (
                        <div
                          key={item.$id}
                          className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 group"
                        >
                          <span
                            className={`flex-1 text-xs truncate ${
                              itemHidden
                                ? "text-(--gray-600) line-through"
                                : "text-(--gray-400)"
                            }`}
                          >
                            {item.name || item.type}
                          </span>
                          <button
                            onClick={() => toggleItemVisibility(item.$id)}
                            className="shrink-0 text-(--gray-500) hover:text-(--gray-300) opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={
                              itemHidden ? "Show shape" : "Hide shape"
                            }
                          >
                            {itemHidden ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Canvas area ─────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          scaleX={stageView.scale}
          scaleY={stageView.scale}
          x={stageView.x}
          y={stageView.y}
          draggable
          onWheel={handleWheel}
          onDragEnd={(e) => {
            // Persist pan position after drag
            setStageView((prev) => ({
              ...prev,
              x: e.target.x(),
              y: e.target.y(),
            }));
          }}
          style={{ cursor: "grab" }}
        >
          {/* Board background */}
          <KonvaLayer listening={false}>
            <Rect
              x={0}
              y={0}
              width={board.width || 1920}
              height={board.height || 1080}
              fill={
                board.backgroundType === "color" && board.backgroundColor
                  ? board.backgroundColor
                  : "#ffffff"
              }
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={10}
              shadowOffset={{ x: 0, y: 4 }}
            />
          </KonvaLayer>

          {/* Content layers — all board layers live in one Konva Layer as Groups.
              listening=true so pin double-click can fire the info modal. */}
          <KonvaLayer>
            {sortedLayers.map((layer) => {
              const layerVisible =
                layer.visible && !hiddenLayerIds.has(layer.$id);
              const visibleItems = (itemsByLayer[layer.$id] ?? []).filter(
                (item) => item.visible && !hiddenItemIds.has(item.$id),
              );

              return (
                <LayerRenderer
                  key={layer.$id}
                  layer={{ ...layer, visible: layerVisible }}
                  items={visibleItems}
                  selectedItemIds={[]}
                  onSelectItem={noop}
                  onUpdateItem={noop}
                />
              );
            })}
          </KonvaLayer>
        </Stage>

        {/* ── Layers panel toggle (only when panel is closed) ────────── */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass-panel border border-white/10 text-(--gray-400) hover:text-(--gray-200) text-xs transition-colors"
            aria-label="Show layers panel"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>
        )}

        {/* ── Zoom toolbar ──────────────────────────────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg glass-panel border border-white/10">
          <button
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            className="p-1 rounded text-(--gray-400) hover:text-(--gray-200) hover:bg-white/10 transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="min-w-14 text-center text-xs text-(--gray-300) tabular-nums select-none">
            {zoomPercent}%
          </span>

          <button
            onClick={() => zoomBy(ZOOM_STEP)}
            className="p-1 rounded text-(--gray-400) hover:text-(--gray-200) hover:bg-white/10 transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button
            onClick={() => setStageView(getFitView(size))}
            className="p-1 rounded text-(--gray-400) hover:text-(--gray-200) hover:bg-white/10 transition-colors"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
