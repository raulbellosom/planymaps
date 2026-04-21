/**
 * Layer Renderer
 * Renders a single layer with its items, respecting visibility and opacity
 */

import { Group } from "react-konva";
import type React from "react";
import type { Layer, BoardItem } from "@/types/board";
import { getRendererForType } from "./item-renderers";
import type { ItemRendererProps } from "./item-renderers/item-renderer";
import type { Node } from "konva/lib/Node";
import { getLayerColor } from "@/lib/layer-colors";

export interface LayerRendererProps {
  layer: Layer;
  items: BoardItem[];
  selectedItemIds: string[];
  /** True when this layer is the currently selected layer in the panel */
  isLayerActive?: boolean;
  onSelectItem: (itemId: string, addToSelection: boolean) => void;
  onUpdateItem: (itemId: string, updates: Partial<BoardItem>) => void;
  onContextMenu?: (itemId: string, x: number, y: number) => void;
}

export const LayerRenderer: React.FC<LayerRendererProps> = ({
  layer,
  items,
  selectedItemIds,
  isLayerActive = false,
  onSelectItem,
  onUpdateItem,
  onContextMenu,
}) => {
  // Skip hidden layers
  if (!layer.visible) {
    return null;
  }

  // Derive the palette color for this layer; only expose it when active
  const layerHighlightColor = isLayerActive
    ? getLayerColor(layer.$id)
    : undefined;

  const handleSelect = (itemId: string, addToSelection: boolean) => {
    onSelectItem(itemId, addToSelection);
  };

  const isMultiSelected = selectedItemIds.length > 1;

  const handleDragEnd = (itemId: string, x: number, y: number) => {
    // Skip if multi-selected — MultiSelectTransformer handles coordinated persistence
    if (isMultiSelected && selectedItemIds.includes(itemId)) return;
    onUpdateItem(itemId, { x, y });
  };

  const handleTransformEnd = (itemId: string, node: Node) => {
    // Skip if multi-selected — MultiSelectTransformer handles this
    if (isMultiSelected && selectedItemIds.includes(itemId)) return;
    // Bake scale into width/height BEFORE resetting, then always store scaleX/Y = 1.
    // Storing the non-1 scale would cause the shape to render at scale*scale size
    // on the next React render, which also corrupts the Konva drag grab-offset.
    const bakedWidth = node.width() * node.scaleX();
    const bakedHeight = node.height() * node.scaleY();

    // Reset on the Konva node immediately so the canvas is correct before React re-renders
    node.scaleX(1);
    node.scaleY(1);

    const updates: Partial<BoardItem> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: 1,
      scaleY: 1,
      width: bakedWidth,
      height: bakedHeight,
    };

    onUpdateItem(itemId, updates);
  };

  return (
    <Group
      id={layer.$id}
      name={layer.name}
      opacity={layer.opacity}
      visible={layer.visible}
      listening={!layer.locked}
    >
      {/* Render selected items last so they sit on top of everything else
          while selected. React uses key={item.$id} so the Konva nodes are
          reused — only their z-position in the layer changes. When deselected
          they fall back to their natural data order. */}
      {[...items]
        .sort((a, b) => {
          const aSelected = selectedItemIds.includes(a.$id);
          const bSelected = selectedItemIds.includes(b.$id);
          if (aSelected === bSelected) return 0;
          return aSelected ? 1 : -1;
        })
        .map((item) => {
          const Renderer = getRendererForType(item.type);
          const isSelected = selectedItemIds.includes(item.$id);

          const rendererProps: ItemRendererProps = {
            item,
            isSelected,
            isMultiSelected: isSelected && isMultiSelected,
            layerHighlightColor,
            onSelect: handleSelect,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd as (
              itemId: string,
              node: unknown,
            ) => void,
            onContextMenu,
            onUpdateItem,
          };

          return <Renderer key={item.$id} {...rendererProps} />;
        })}
    </Group>
  );
};
