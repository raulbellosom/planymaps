/**
 * Ellipse Item Renderer
 */

import { Ellipse, Transformer } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import { parseStyleProps, parseInteractionProps } from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef } from "react";

export const EllipseRenderer: React.FC<ItemRendererProps> = ({
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
    // node.x()/y() is the CENTER of the ellipse; convert to top-left for storage
    const rx = node.radiusX() * node.scaleX();
    const ry = node.radiusY() * node.scaleY();
    onDragEnd?.(item.$id, node.x() - rx, node.y() - ry);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node || !onTransformEnd) return;
    // Bake scale into radii, then convert center to top-left before delegating
    const bakedRx = node.radiusX() * node.scaleX();
    const bakedRy = node.radiusY() * node.scaleY();
    node.radiusX(bakedRx);
    node.radiusY(bakedRy);
    node.scaleX(1);
    node.scaleY(1);
    node.x(node.x() - bakedRx);
    node.y(node.y() - bakedRy);
    onTransformEnd(item.$id, node);
  };

  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(item.$id, e.evt.clientX, e.evt.clientY);
  };

  // Ellipse uses radiusX and radiusY instead of width/height
  const radiusX = item.width / 2;
  const radiusY = item.height / 2;
  const centerX = item.x + radiusX;
  const centerY = item.y + radiusY;

  return (
    <>
      <Ellipse
        ref={shapeRef}
        id={item.$id}
        x={centerX}
        y={centerY}
        radiusX={radiusX}
        radiusY={radiusY}
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
      />
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
