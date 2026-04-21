/**
 * Placeholder Item Renderer
 * Used for unknown item types or during development
 */

import { Rect, Text } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import { parseStyleProps } from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";

export const PlaceholderRenderer: React.FC<ItemRendererProps> = ({
  item,
  onSelect,
}) => {
  const style = parseStyleProps(item);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    e.cancelBubble = true;
    onSelect?.(item.$id, e.evt.shiftKey);
  };

  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
    onSelect?.(item.$id, false);
  };

  return (
    <>
      <Rect
        id={item.$id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        fill="#f0f0f0"
        stroke="#999999"
        strokeWidth={1}
        dash={[4, 4]}
        opacity={style.opacity !== undefined ? style.opacity : 1}
        visible={item.visible}
        onClick={handleClick}
        onTap={handleTap}
      />
      <Text
        x={item.x}
        y={item.y + item.height / 2 - 6}
        width={item.width}
        text={`Unknown: ${item.type}`}
        fontSize={10}
        fontFamily="Arial"
        fill="#666666"
        align="center"
      />
    </>
  );
};
