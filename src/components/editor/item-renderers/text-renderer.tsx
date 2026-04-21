/**
 * Text Item Renderer
 * Supports double-click inline editing via an HTML textarea overlay.
 */

"use client";

import { Text, Transformer, Rect } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import type React from "react";
import {
  parseStyleProps,
  parseInteractionProps,
  parseContentProps,
} from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";

export const TextRenderer: React.FC<ItemRendererProps> = ({
  item,
  isSelected,
  isMultiSelected,
  layerHighlightColor,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
  onUpdateItem,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);

  const textEdit = useUIStore((state) => state.textEdit);
  const setTextEdit = useUIStore((state) => state.setTextEdit);
  const isEditing = textEdit?.itemId === item.$id;

  const style = parseStyleProps(item);
  const interaction = parseInteractionProps(item);
  const content = parseContentProps(item);

  // Attach transformer when selected (but not while editing)
  useEffect(() => {
    if (
      isSelected &&
      !isEditing &&
      transformerRef.current &&
      shapeRef.current
    ) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isMultiSelected, isEditing]);

  const enterEditMode = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const stage = node.getStage();
    if (!stage) return;

    const containerRect = stage.container().getBoundingClientRect();
    const absPos = node.getAbsolutePosition();
    const rotation = node.getAbsoluteRotation();
    const stageScale = stage.scaleX();

    const x = containerRect.left + absPos.x;
    const y = containerRect.top + absPos.y;
    const w = Math.max(node.width() * node.scaleX() * stageScale, 30);
    const h = Math.max(node.height() * node.scaleY() * stageScale, 20);
    const fs = (style.fontSize || 16) * stageScale;

    const rawFontStyle = style.fontStyle || "normal";
    const isBold = rawFontStyle.includes("bold");
    const isItalic = rawFontStyle.includes("italic");

    setTextEdit({
      itemId: item.$id,
      text: content.text || "",
      textareaStyle: {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        fontSize: `${fs}px`,
        fontFamily: style.fontFamily || "Arial",
        fontStyle: isItalic ? "italic" : "normal",
        fontWeight: isBold ? "bold" : "normal",
        color: style.fill || "#000000",
        textAlign:
          (style.textAlign as React.CSSProperties["textAlign"]) || "left",
        background: "rgba(255,255,255,0.85)",
        border: "1.5px dashed #3b82f6",
        borderRadius: "2px",
        outline: "none",
        resize: "none",
        padding: "0",
        margin: "0",
        overflow: "hidden",
        lineHeight: `${fs * 1.2}px`,
        transformOrigin: "top left",
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        zIndex: 9999,
      },
    });
  }, [style, content, item.$id, setTextEdit]);

  // ─── Konva event handlers ─────────────────────────────────────────────────

  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (item.locked) return;
    enterEditMode();
  };

  const handleDblTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
    if (item.locked) return;
    enterEditMode();
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    if (isEditing) return;
    e.cancelBubble = true;
    onSelect?.(item.$id, e.evt.shiftKey);
  };

  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    if (isEditing) return;
    e.cancelBubble = true;
    onSelect?.(item.$id, false);
  };

  const handleDragEnd = (_e: KonvaEventObject<DragEvent>) => {
    const node = shapeRef.current;
    if (!node) return;
    onDragEnd?.(item.$id, node.x(), node.y());
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (node && onTransformEnd) {
      onTransformEnd(item.$id, node);
    }
  };

  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(item.$id, e.evt.clientX, e.evt.clientY);
  };

  // ─── Textarea event handlers ──────────────────────────────────────────────
  // (handled in TextEditor component rendered outside Stage in editor-canvas)

  return (
    <>
      {/* Subtle background highlight shown only while the textarea edit overlay is active */}
      {isEditing && (
        <Rect
          listening={false}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          scaleX={item.scaleX}
          scaleY={item.scaleY}
          fill="rgba(15,23,42,0.08)"
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[4, 3]}
          cornerRadius={2}
        />
      )}
      <Text
        ref={shapeRef}
        id={item.$id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        text={content.text || "Text"}
        fontSize={style.fontSize || 16}
        fontFamily={style.fontFamily || "Arial"}
        fontStyle={style.fontStyle || "normal"}
        fill={style.fill || "#1e293b"}
        align={style.textAlign || "left"}
        verticalAlign={style.verticalAlign || "top"}
        /* Fade out the canvas text while the textarea overlay is active */
        opacity={
          isEditing ? 0 : style.opacity !== undefined ? style.opacity : 1
        }
        visible={item.visible}
        draggable={
          isSelected &&
          !isEditing &&
          interaction.draggable !== false &&
          !item.locked
        }
        onClick={handleClick}
        onTap={handleTap}
        onDblClick={handleDblClick}
        onDblTap={handleDblTap}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleContextMenu}
      />
      {isSelected && !isMultiSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 1 || newBox.height < 1) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          anchorFill={layerHighlightColor || "#3b82f6"}
          anchorStroke={layerHighlightColor || "#3b82f6"}
          borderStroke={layerHighlightColor || "#3b82f6"}
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  );
};
