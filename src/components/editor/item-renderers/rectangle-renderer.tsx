/**
 * Rectangle Item Renderer
 */

import { Rect, Transformer } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import { parseStyleProps, parseInteractionProps } from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef } from "react";

export const RectangleRenderer: React.FC<ItemRendererProps> = ({
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

  return (
    <>
      <Rect
        ref={shapeRef}
        id={item.$id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        fill={style.fill || "#ffffff"}
        stroke={style.stroke || "#000000"}
        strokeWidth={style.strokeWidth || 1}
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
        cornerRadius={0}
      />
      {isSelected && !isMultiSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to positive dimensions
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
          borderStroke={layerHighlightColor || "#3b82f6"}
          anchorStroke={layerHighlightColor || "#3b82f6"}
          anchorFill={layerHighlightColor || "#3b82f6"}
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  );
};
