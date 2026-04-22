/**
 * Pin Item Renderer
 *
 * Implements a zoom-invariant map pin:
 *   - Maintains a constant on-screen pixel footprint (PIN_SCREEN_SIZE) at all zoom levels.
 *   - The pin TIP is anchored to canvas coordinate (item.x, item.y) with zero drift.
 *   - No visible text label — content is surfaced via the hover PinPopover.
 *   - Enlarged transparent hit circle for reliable click / touch targeting.
 *
 * Counter-scale maths
 * ───────────────────
 *   pathScale = PIN_SCREEN_SIZE / (24 × stageScale)
 *
 *   Stage multiplies every canvas unit by stageScale, so:
 *     screen size = pathScale × 24 × stageScale = PIN_SCREEN_SIZE  ✓ (constant)
 *
 *   Tip alignment: the Lucide MapPin tip is at (TIP_PATH_X, TIP_PATH_Y) in
 *   the 24-unit path space. Offsetting the Path node by
 *     (-TIP_PATH_X × pathScale, -TIP_PATH_Y × pathScale)
 *   places the tip at Group-local (0, 0) = canvas (item.x, item.y). Zero drift
 *   across all zoom levels because the Group origin is scale-invariant.
 *
 * Zoom behaviour
 * ──────────────
 *   At stageScale ≤ 1 (zoomed out) the pin keeps its reference screen size.
 *   At stageScale > 1 (zoomed in) the pin appears proportionally smaller relative
 *   to the canvas — exactly the expected "real-world map pin" experience.
 */

"use client";

import { Circle, Group, Path, Transformer } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import {
  parseStyleProps,
  parseInteractionProps,
  parseContentProps,
} from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";

// ─── Shape constants ───────────────────────────────────────────────────────────

/**
 * Modern minimalist pin silhouette — filled shape with smooth bezier curves.
 *
 * Design rationale:
 *   - Stroke-free silhouette: Pure filled shape for modern, clean aesthetic
 *   - Smooth bezier curves: No harsh angles, organic flowing form
 *   - Inner circle cutout: Creates depth and pin-character instantly recognizable
 *   - fill-rule="evenodd": Inner circle properly subtracted from outer shape
 *   - Centered geometry: Tip at y=22, head center at y=9 for balanced proportions
 *
 * Path construction (24×24 viewBox):
 *   - Tip: (12, 22) — bottom anchor point
 *   - Head center: (12, 9) — circular portion center
 *   - Top: y=2 — rounded dome apex
 *   - Widest point: x=3 and x=21 — graceful outward bulge
 */
const MAP_PIN_PATH =
  "M12 22C12 22 4 15 4 9C4 4.5 7.5 2 12 2C16.5 2 20 4.5 20 9C20 15 12 22 12 22ZM12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z";

/** On-screen size of the pin icon in CSS pixels — constant at every zoom level. */
const PIN_SCREEN_SIZE = 36;

/** X of the pin TIP in native path space (bottom point of the teardrop). */
const TIP_PATH_X = 12;
/** Y of the pin TIP in native path space. */
const TIP_PATH_Y = 22;

/** Y of the pin HEAD centre in native path space (inner circle center). */
const HEAD_PATH_Y = 10;

/** Radius of the transparent hit-area circle in screen pixels (constant across zoom). */
const HIT_RADIUS_SCREEN = 20;

// ─────────────────────────────────────────────────────────────────────────────

export const PinRenderer: React.FC<ItemRendererProps> = ({
  item,
  isSelected,
  isMultiSelected,
  layerHighlightColor,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
}) => {
  const groupRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPinPopover = useUIStore((state) => state.setPinPopover);
  const setPinEditModal = useUIStore((state) => state.setPinEditModal);

  /** Current stage zoom factor (1.0 = 100%). Drives all counter-scaling. */
  const stageScale = useUIStore((state) => state.viewport.scale);

  const style = parseStyleProps(item);
  const interaction = parseInteractionProps(item);
  const content = parseContentProps(item);

  // ── Counter-scale derived values ─────────────────────────────────────────

  // Scale that maps the 24-unit path to PIN_SCREEN_SIZE on screen.
  const pathScale = PIN_SCREEN_SIZE / (24 * stageScale);

  // Offset so the path TIP lands on Group origin = canvas (item.x, item.y).
  const pathOffsetX = -TIP_PATH_X * pathScale;
  const pathOffsetY = -TIP_PATH_Y * pathScale;

  // Pin head centre in Group-local canvas coordinates (above the tip = negative Y).
  const headCenterY = (HEAD_PATH_Y - TIP_PATH_Y) * pathScale;

  // Hit-circle radius in canvas units → constant HIT_RADIUS_SCREEN px on screen.
  const hitRadiusCanvas = HIT_RADIUS_SCREEN / stageScale;

  // strokeScaleEnabled=false prevents the shape's own scaleX/Y from magnifying
  // the stroke; pre-dividing by stageScale then cancels the stage's contribution,
  // yielding a constant on-screen stroke width regardless of zoom.
  //
  // Dynamic stroke scaling: when zoomed out below STROKE_SCALE_THRESHOLD,
  // the stroke width is reduced proportionally so the pin fill remains visible
  // instead of appearing as a hollow outline.
  const STROKE_SCALE_THRESHOLD = 0.5;
  const STROKE_SCALE_FACTOR = 0.5; // Factor to reduce stroke by when below threshold
  const baseStrokeWidth = style.strokeWidth ?? 1.5;
  const dynamicStrokeScale =
    stageScale < STROKE_SCALE_THRESHOLD
      ? STROKE_SCALE_FACTOR +
        (stageScale / STROKE_SCALE_THRESHOLD) * (1 - STROKE_SCALE_FACTOR)
      : 1;
  const strokeWidthCanvas = (baseStrokeWidth * dynamicStrokeScale) / stageScale;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isMultiSelected]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      useUIStore.getState().setPinPopover(null);
    };
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    e.cancelBubble = true;
    onSelect?.(item.$id, e.evt.shiftKey);
  };

  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
    onSelect?.(item.$id, false);
  };

  const handleDragEnd = (_e: KonvaEventObject<DragEvent>) => {
    const node = groupRef.current;
    if (!node) return;
    // node.x() / node.y() are canvas coordinates — unaffected by stageScale.
    onDragEnd?.(item.$id, node.x(), node.y());
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (node && onTransformEnd) onTransformEnd(item.$id, node);
  };

  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(item.$id, e.evt.clientX, e.evt.clientY);
  };

  /**
   * Opens the pin edit modal on double-click / double-tap.
   * Must be attached directly to leaf shapes — Konva does not reliably bubble
   * `dblclick` events through Group nodes (unlike single `click`).
   */
  const handleDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (item.locked) return;
      setPinPopover(null);
      setPinEditModal({ itemId: item.$id });
    },
    [item.locked, item.$id, setPinPopover, setPinEditModal],
  );

  const handleDblTap = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true;
      if (item.locked) return;
      setPinPopover(null);
      setPinEditModal({ itemId: item.$id });
    },
    [item.locked, item.$id, setPinPopover, setPinEditModal],
  );

  const label = content.label || "";
  const note = content.note || "";
  const images = (content as { images?: string[] }).images || [];
  const pinColor = style.fill || "#e53e3e";

  const handleMouseEnter = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      setPinPopover({
        x: e.evt.clientX + 12,
        y: e.evt.clientY - 8,
        label,
        note,
        images,
      });
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "pointer";
    },
    [setPinPopover, label, note, images],
  );

  const handleMouseLeave = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "default";
      leaveTimerRef.current = setTimeout(() => setPinPopover(null), 120);
    },
    [setPinPopover],
  );

  return (
    <>
      {/*
       * The Group origin IS the pin tip — precisely at canvas (item.x, item.y).
       *
       * item.scaleX / item.scaleY are intentionally NOT applied:
       *   • The counter-scale math holds only when the Group has no extra scale.
       *   • The tip at Group-local (0, 0) is scale-invariant, but every other
       *     point in the visual would stretch/compress with a non-unity Group scale,
       *     breaking the constant-screen-size guarantee.
       *   • Geographic markers have no meaningful "resize" operation.
       *
       * item.rotation IS applied: tilting the icon while the tip stays anchored
       * is a valid and natural operation for a map marker.
       */}
      <Group
        ref={groupRef}
        id={item.$id}
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        visible={item.visible}
        draggable={
          isSelected && interaction.draggable !== false && !item.locked
        }
        onClick={handleClick}
        onTap={handleTap}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/*
         * The pin icon.
         * Offset so the path TIP (TIP_PATH_X, TIP_PATH_Y in path space) coincides
         * with Group origin (0, 0) = canvas coordinate (item.x, item.y).
         * Scaled by pathScale so the icon is PIN_SCREEN_SIZE px tall/wide on screen
         * regardless of the current stage zoom level.
         */}
        <Path
          x={pathOffsetX}
          y={pathOffsetY}
          data={MAP_PIN_PATH}
          scaleX={pathScale}
          scaleY={pathScale}
          fill={pinColor}
          stroke={style.stroke ?? "#ffffff"}
          strokeWidth={strokeWidthCanvas}
          strokeScaleEnabled={false}
          opacity={style.opacity ?? 1}
          onClick={handleClick}
          onTap={handleTap}
          onDblClick={handleDblClick}
          onDblTap={handleDblTap}
        />
        {/*
         * Transparent hit-area circle.
         * Centred on the pin HEAD (the wide, visually dominant part) rather than
         * the narrow tip — this is the natural target for user interaction.
         * Rendered after the Path so it sits on top in z-order and receives pointer
         * events first, guaranteeing the full circle area is reliably clickable.
         * Its canvas radius = HIT_RADIUS_SCREEN / stageScale keeps the screen-pixel
         * footprint constant across all zoom levels.
         */}
        <Circle
          x={0}
          y={headCenterY}
          radius={hitRadiusCanvas}
          fill="rgba(0,0,0,0.001)"
          onClick={handleClick}
          onTap={handleTap}
          onDblClick={handleDblClick}
          onDblTap={handleDblTap}
        />
      </Group>

      {/*
       * Selection indicator: border only, no resize or rotation anchors.
       * Moving the pin tip to a new canvas coordinate (drag) is the only
       * meaningful positional edit; resizing/rotating is disabled.
       */}
      {isSelected && !isMultiSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          enabledAnchors={[]}
          borderStroke={layerHighlightColor || "#3b82f6"}
          borderStrokeWidth={1.5}
          anchorSize={0}
          padding={6}
        />
      )}
    </>
  );
};
