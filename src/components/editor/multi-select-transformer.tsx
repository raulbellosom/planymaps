"use client";

/**
 * Multi-Select Transformer
 * Renders a single Konva Transformer wrapping all selected nodes.
 * Handles coordinated drag (all selected shapes move together)
 * and unified resize / rotate persistence.
 */

import { useEffect, useRef, useCallback } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import type { BoardItem } from "@/types/board";
import { useBoardStore } from "@/stores/board-store";

interface MultiSelectTransformerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectedItemIds: string[];
  layerHighlightColor?: string;
  onUpdateItem: (itemId: string, updates: Partial<BoardItem>) => void;
}

export function MultiSelectTransformer({
  stageRef,
  selectedItemIds,
  layerHighlightColor,
  onUpdateItem,
}: MultiSelectTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  /** Konva node positions captured at drag start. */
  const dragStartNodePositions = useRef<
    Record<string, { x: number; y: number }>
  >({});
  /**
   * item.x / item.y captured at drag start — read fresh from the Zustand store
   * to avoid stale React-render data when the user drags rapidly.
   */
  const dragStartItemPositions = useRef<
    Record<string, { x: number; y: number }>
  >({});

  /**
   * Konva node positions captured at transform start — used by handleTransformEnd
   * to compute offset-ratio so shapes with non-top-left origins (e.g. Ellipse)
   * map back to the correct item.x / item.y.
   */
  const transformStartNodePositions = useRef<
    Record<string, { x: number; y: number }>
  >({});

  const isMultiSelect = selectedItemIds.length > 1;

  // Stable ref so Konva native-event closures always call the latest fn
  const onUpdateItemRef = useRef(onUpdateItem);
  onUpdateItemRef.current = onUpdateItem;

  // Stable ref for selectedItemIds used by transform handlers
  const selectedIdsRef = useRef(selectedItemIds);
  selectedIdsRef.current = selectedItemIds;

  useEffect(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr || !isMultiSelect) {
      tr?.nodes([]);
      tr?.getLayer()?.batchDraw();
      return;
    }

    // Find all selected Konva nodes across every layer
    const nodes: Konva.Node[] = [];
    for (const id of selectedItemIds) {
      const node = stage.findOne("#" + id);
      if (node) nodes.push(node);
    }

    if (nodes.length < 2) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();

    // ── Coordinated drag ──────────────────────────────────────────────
    const handleDragStart = () => {
      const nodePositions: Record<string, { x: number; y: number }> = {};
      const itemStarts: Record<string, { x: number; y: number }> = {};

      // Read item.x / item.y fresh from the Zustand store so we always get the
      // latest committed position even if React hasn't re-rendered yet from
      // the previous drag's store update (avoids stale-ref snap-back on rapid drags).
      const allItems = Object.values(
        useBoardStore.getState().itemsByLayer,
      ).flat();

      for (const node of nodes) {
        const id = node.id();
        nodePositions[id] = { x: node.x(), y: node.y() };
        const item = allItems.find((i) => i.$id === id);
        if (item) itemStarts[id] = { x: item.x, y: item.y };
      }
      dragStartNodePositions.current = nodePositions;
      dragStartItemPositions.current = itemStarts;
    };

    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
      const draggedNode = e.target;
      const draggedId = draggedNode.id();
      const startPos = dragStartNodePositions.current[draggedId];
      if (!startPos) return;

      const dx = draggedNode.x() - startPos.x;
      const dy = draggedNode.y() - startPos.y;

      for (const node of nodes) {
        if (node.id() === draggedId) continue;
        const nodeStart = dragStartNodePositions.current[node.id()];
        if (nodeStart) {
          node.x(nodeStart.x + dx);
          node.y(nodeStart.y + dy);
        }
      }
    };

    const handleDragEnd = () => {
      for (const node of nodes) {
        const id = node.id();
        const nodeStart = dragStartNodePositions.current[id];
        const itemStart = dragStartItemPositions.current[id];
        if (nodeStart && itemStart) {
          // Apply delta in Konva-space to item.x/y (which may differ from
          // node.x/y, e.g. Ellipse uses center while item.x/y is top-left).
          const dx = node.x() - nodeStart.x;
          const dy = node.y() - nodeStart.y;
          onUpdateItemRef.current(id, {
            x: itemStart.x + dx,
            y: itemStart.y + dy,
          });
        }
      }
      dragStartNodePositions.current = {};
      dragStartItemPositions.current = {};
    };

    // Attach namespaced events so cleanup is safe
    for (const node of nodes) {
      node.on("dragstart.multiSelect", handleDragStart);
      node.on("dragmove.multiSelect", handleDragMove);
      node.on("dragend.multiSelect", handleDragEnd);
    }

    return () => {
      for (const node of nodes) {
        node.off("dragstart.multiSelect");
        node.off("dragmove.multiSelect");
        node.off("dragend.multiSelect");
      }
    };
  }, [selectedItemIds, stageRef, isMultiSelect]);

  // Persist all nodes after a group resize / rotate
  const handleTransformStart = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const positions: Record<string, { x: number; y: number }> = {};
    for (const id of selectedIdsRef.current) {
      const node = stage.findOne("#" + id);
      if (node) positions[id] = { x: node.x(), y: node.y() };
    }
    transformStartNodePositions.current = positions;
  }, [stageRef]);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Read fresh item data from the store to avoid React-render staleness.
    const allItems = Object.values(
      useBoardStore.getState().itemsByLayer,
    ).flat();

    for (const id of selectedIdsRef.current) {
      const node = stage.findOne("#" + id);
      if (!node) continue;

      const bakedWidth = node.width() * node.scaleX();
      const bakedHeight = node.height() * node.scaleY();

      // Compute how far the Konva node origin is from item.x/y (e.g. Ellipse:
      // node origin = center, item.x/y = top-left → offsetRatio = 0.5).
      // We capture this from the pre-transform state so it's shape-type-agnostic.
      const item = allItems.find((i) => i.$id === id);
      const preNodePos = transformStartNodePositions.current[id];

      let newItemX: number;
      let newItemY: number;

      if (item && preNodePos && item.width > 0 && item.height > 0) {
        const offsetRatioX = (preNodePos.x - item.x) / item.width;
        const offsetRatioY = (preNodePos.y - item.y) / item.height;
        newItemX = node.x() - offsetRatioX * bakedWidth;
        newItemY = node.y() - offsetRatioY * bakedHeight;
      } else {
        // Fallback: node origin IS item origin (Rect, Line, etc.)
        newItemX = node.x();
        newItemY = node.y();
      }

      // Reset scale on the Konva node immediately
      node.scaleX(1);
      node.scaleY(1);

      onUpdateItemRef.current(id, {
        x: newItemX,
        y: newItemY,
        rotation: node.rotation(),
        scaleX: 1,
        scaleY: 1,
        width: bakedWidth,
        height: bakedHeight,
      });
    }

    transformStartNodePositions.current = {};
  }, [stageRef]);

  if (!isMultiSelect) return null;

  return (
    <Transformer
      ref={transformerRef}
      onTransformStart={handleTransformStart}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 1 || newBox.height < 1) return oldBox;
        return newBox;
      }}
      rotateEnabled={true}
      enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
      borderStroke={layerHighlightColor || "#3b82f6"}
      anchorStroke={layerHighlightColor || "#3b82f6"}
      anchorFill={layerHighlightColor || "#3b82f6"}
      anchorSize={8}
      anchorCornerRadius={2}
      borderDash={[4, 4]}
    />
  );
}
