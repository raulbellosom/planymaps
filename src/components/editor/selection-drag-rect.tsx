"use client";

/**
 * SelectionDragRect
 *
 * Renders an invisible draggable rectangle that exactly covers the combined
 * bounding box of all currently-selected items. This solves two problems:
 *
 * 1. **Gap-between-shapes drag**: Without this, clicking in the empty space
 *    between multi-selected shapes hits the Stage and starts a new selection
 *    box instead of moving the group.
 *
 * 2. **Thin-shape drag surface**: Shapes like lines/arrows lack a filled drag
 *    area — this rect provides a reliable hit target for the whole group.
 *
 * Z-order: This component's Layer is rendered BELOW the item Layers so that
 * clicks on individual shapes still fire the shape's own event handlers first.
 * When clicking in empty space WITHIN the selection bounding box the rect
 * catches the event before it reaches the Stage.
 *
 * The rect uses `fill="rgba(0,0,0,0.001)"` — imperceptible to the eye but
 * enough for Konva's hit-detection canvas (a transparent / null fill would be
 * completely invisible to hit-testing).
 */

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Layer, Rect } from "react-konva";
import type Konva from "konva";
import type { BoardItem } from "@/types/board";

interface SelectionDragRectProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectedItemIds: string[];
  itemsByLayer: Record<string, BoardItem[]>;
  onUpdateItem: (itemId: string, updates: Partial<BoardItem>) => void;
}

/** Padding (in canvas units) added around the computed bounding box. */
const PADDING = 8;

export function SelectionDragRect({
  stageRef,
  selectedItemIds,
  itemsByLayer,
  onUpdateItem,
}: SelectionDragRectProps) {
  const rectRef = useRef<Konva.Rect>(null);

  /** Positions of all selected nodes captured at the start of each drag. */
  const dragStartPositions = useRef<Record<string, { x: number; y: number }>>(
    {},
  );
  /** The rect's own position at drag start (used to compute the delta). */
  const dragStartRectPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stable ref so event-handler closures always call the latest callback.
  const onUpdateItemRef = useRef(onUpdateItem);
  onUpdateItemRef.current = onUpdateItem;

  const isMultiSelect = selectedItemIds.length > 1;

  /**
   * Compute the combined axis-aligned bounding box from store item data.
   * We intentionally ignore rotation here — an approximate bbox is fine for
   * an invisible hit surface; the Transformer handles precise transform UX.
   */
  const bbox = useMemo(() => {
    if (!isMultiSelect) return null;

    const allItems = Object.values(itemsByLayer).flat();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.$id === id);
      if (!item) continue;
      const w = item.width || 100;
      const h = item.height || 100;
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + w);
      maxY = Math.max(maxY, item.y + h);
    }

    if (!isFinite(minX)) return null;

    return {
      x: minX - PADDING,
      y: minY - PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    };
  }, [selectedItemIds, itemsByLayer, isMultiSelect]);

  // Keep the rect at the correct bbox position whenever it changes (e.g. after
  // an item is resized, moved by the Transformer, or selection changes).
  useEffect(() => {
    const rect = rectRef.current;
    if (!rect || !bbox) return;
    rect.x(bbox.x);
    rect.y(bbox.y);
    rect.width(bbox.width);
    rect.height(bbox.height);
    rect.getLayer()?.batchDraw();
  }, [bbox]);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback(() => {
    const stage = stageRef.current;
    const rect = rectRef.current;
    if (!stage || !rect) return;

    // Record starting positions of all selected nodes.
    const positions: Record<string, { x: number; y: number }> = {};
    for (const id of selectedItemIds) {
      const node = stage.findOne<Konva.Node>("#" + id);
      if (node) positions[id] = { x: node.x(), y: node.y() };
    }
    dragStartPositions.current = positions;
    dragStartRectPos.current = { x: rect.x(), y: rect.y() };
  }, [stageRef, selectedItemIds]);

  const handleDragMove = useCallback(() => {
    const stage = stageRef.current;
    const rect = rectRef.current;
    if (!stage || !rect) return;

    const dx = rect.x() - dragStartRectPos.current.x;
    const dy = rect.y() - dragStartRectPos.current.y;

    for (const id of selectedItemIds) {
      const node = stage.findOne<Konva.Node>("#" + id);
      const startPos = dragStartPositions.current[id];
      if (!node || !startPos) continue;
      node.x(startPos.x + dx);
      node.y(startPos.y + dy);
    }

    // Force the Transformer (in its own layer) to repaint so its border follows.
    stage.batchDraw();
  }, [stageRef, selectedItemIds]);

  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    const rect = rectRef.current;
    if (!stage || !rect) return;

    const dx = rect.x() - dragStartRectPos.current.x;
    const dy = rect.y() - dragStartRectPos.current.y;

    for (const id of selectedItemIds) {
      const startPos = dragStartPositions.current[id];
      if (!startPos) continue;
      onUpdateItemRef.current(id, {
        x: startPos.x + dx,
        y: startPos.y + dy,
      });
    }

    dragStartPositions.current = {};

    // After persisting, snap the rect back to where bbox will be on the next
    // render (the store update triggers a re-render → useMemo recomputes bbox).
    // batchDraw is enough; React's re-render will set the correct position.
    stage.batchDraw();
  }, [stageRef, selectedItemIds]);

  if (!isMultiSelect || !bbox) return null;

  return (
    <Layer>
      <Rect
        ref={rectRef}
        x={bbox.x}
        y={bbox.y}
        width={bbox.width}
        height={bbox.height}
        // Near-transparent fill — required for Konva hit detection.
        // A fill of null / "transparent" makes the shape invisible to hits.
        fill="rgba(0,0,0,0.001)"
        stroke="transparent"
        strokeWidth={0}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        // Prevent right-click context menu from triggering on the invisible rect.
        onContextMenu={(e) => e.evt.preventDefault()}
      />
    </Layer>
  );
}
