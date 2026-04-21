/**
 * Arrow Item Renderer
 */

import { Arrow, Line, Transformer } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import {
  parseStyleProps,
  parseInteractionProps,
  parseContentProps,
} from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef } from "react";

export const ArrowRenderer: React.FC<ItemRendererProps> = ({
  item,
  isSelected,
  isMultiSelected,
  layerHighlightColor,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);

  const style = parseStyleProps(item);
  const interaction = parseInteractionProps(item);
  const content = parseContentProps(item);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isMultiSelected]);

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

  // Arrow uses points from content or generates from transform
  // Arrow style: none, left, right, double
  const arrowStyle = content.arrowStyle || "right";
  const points = content.points || [0, 0, item.width, item.height];

  // Determine pointer config based on arrow style
  const showStartPointer = arrowStyle === "left" || arrowStyle === "double";
  const showEndPointer = arrowStyle === "right" || arrowStyle === "double";

  // For left arrow, we need to reverse the points
  const displayPoints =
    arrowStyle === "left"
      ? [points[2], points[3], points[0], points[1]]
      : points;

  return (
    <>
      {arrowStyle === "none" ? (
        <Line
          ref={shapeRef}
          id={item.$id}
          x={item.x}
          y={item.y}
          points={displayPoints}
          stroke={style.stroke || "#000000"}
          strokeWidth={style.strokeWidth || 1}
          hitStrokeWidth={20}
          opacity={style.opacity !== undefined ? style.opacity : 1}
          visible={item.visible}
          draggable={
            isSelected && interaction.draggable !== false && !item.locked
          }
          onClick={handleClick}
          onTap={handleTap}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={handleContextMenu}
          lineCap="round"
          lineJoin="round"
        />
      ) : (
        <Arrow
          ref={shapeRef}
          id={item.$id}
          x={item.x}
          y={item.y}
          points={displayPoints}
          stroke={style.stroke || "#000000"}
          strokeWidth={style.strokeWidth || 1}
          hitStrokeWidth={20}
          fill={style.stroke || "#000000"}
          opacity={style.opacity !== undefined ? style.opacity : 1}
          visible={item.visible}
          draggable={
            isSelected && interaction.draggable !== false && !item.locked
          }
          onClick={handleClick}
          onTap={handleTap}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={handleContextMenu}
          pointerLength={showStartPointer || showEndPointer ? 10 : 0}
          pointerWidth={10}
          pointerAtBeginning={showStartPointer}
          pointerAtEnd={showEndPointer}
          lineCap="round"
          lineJoin="round"
        />
      )}
      {isSelected && !isMultiSelected && (
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
