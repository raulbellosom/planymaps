/**
 * Item Renderer Interface
 * Base type for all item renderers by type dispatch
 */

import type { BoardItem } from "@/types/board";

export interface ItemRendererProps {
  item: BoardItem;
  isSelected: boolean;
  /** True when 2+ items are selected — individual Transformers are hidden */
  isMultiSelected?: boolean;
  /** Set to the layer's palette color when the layer is actively selected */
  layerHighlightColor?: string;
  onSelect?: (itemId: string, addToSelection: boolean) => void;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: (itemId: string, x: number, y: number) => void;
  onTransformEnd?: (itemId: string, node: unknown) => void;
  onContextMenu?: (itemId: string, x: number, y: number) => void;
  /** Generic item update — used by text editing, pin inline fields etc. */
  onUpdateItem?: (itemId: string, updates: Partial<BoardItem>) => void;
}

export type ItemRendererComponent = React.FC<ItemRendererProps>;

export interface ItemRendererConfig {
  type: string;
  component: ItemRendererComponent;
}

// Registry of item renderers by type
const itemRenderers: Record<string, ItemRendererComponent> = {};

// Register a renderer for a specific item type
export function registerItemRenderer(
  type: string,
  renderer: ItemRendererComponent,
): void {
  itemRenderers[type] = renderer;
}

// Get renderer for a specific item type
export function getItemRenderer(type: string): ItemRendererComponent | null {
  return itemRenderers[type] || null;
}

// Check if a renderer exists for a type
export function hasItemRenderer(type: string): boolean {
  return type in itemRenderers;
}

// Get all registered types
export function getRegisteredTypes(): string[] {
  return Object.keys(itemRenderers);
}
