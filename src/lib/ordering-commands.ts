/**
 * Ordering Commands
 * Functions for reordering layers and items
 */

import type { BoardItem, Layer } from "@/types/board";

/**
 * Reorder items within a layer by moving an item to a new index
 */
export function reorderItems(
  items: BoardItem[],
  activeId: string,
  overId: string,
): BoardItem[] {
  const oldIndex = items.findIndex((item) => item.$id === activeId);
  const newIndex = items.findIndex((item) => item.$id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }

  const newItems = [...items];
  const [removed] = newItems.splice(oldIndex, 1);
  newItems.splice(newIndex, 0, removed);

  // Update orderIndex for all items
  return newItems.map((item, index) => ({
    ...item,
    orderIndex: index,
  }));
}

/**
 * Move item one position up (lower orderIndex = rendered first)
 */
export function bringForward(items: BoardItem[], itemId: string): BoardItem[] {
  const index = items.findIndex((item) => item.$id === itemId);
  if (index === -1 || index >= items.length - 1) {
    return items;
  }

  const newItems = [...items];
  const temp = newItems[index];
  newItems[index] = newItems[index + 1];
  newItems[index + 1] = temp;

  // Update orderIndex
  return newItems.map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}

/**
 * Move item one position down (higher orderIndex = rendered last)
 */
export function sendBackward(items: BoardItem[], itemId: string): BoardItem[] {
  const index = items.findIndex((item) => item.$id === itemId);
  if (index <= 0) {
    return items;
  }

  const newItems = [...items];
  const temp = newItems[index];
  newItems[index] = newItems[index - 1];
  newItems[index - 1] = temp;

  // Update orderIndex
  return newItems.map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}

/**
 * Move item to the front (first position)
 */
export function bringToFront(items: BoardItem[], itemId: string): BoardItem[] {
  const index = items.findIndex((item) => item.$id === itemId);
  if (index === -1) {
    return items;
  }

  const newItems = [...items];
  const [removed] = newItems.splice(index, 1);
  newItems.push(removed);

  // Update orderIndex
  return newItems.map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}

/**
 * Move item to the back (last position)
 */
export function sendToBack(items: BoardItem[], itemId: string): BoardItem[] {
  const index = items.findIndex((item) => item.$id === itemId);
  if (index === -1) {
    return items;
  }

  const newItems = [...items];
  const [removed] = newItems.splice(index, 1);
  newItems.unshift(removed);

  // Update orderIndex
  return newItems.map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}

/**
 * Reorder layers by moving a layer to a new index
 */
export function reorderLayers(
  layers: Layer[],
  activeId: string,
  overId: string,
): Layer[] {
  const oldIndex = layers.findIndex((layer) => layer.$id === activeId);
  const newIndex = layers.findIndex((layer) => layer.$id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return layers;
  }

  const newLayers = [...layers];
  const [removed] = newLayers.splice(oldIndex, 1);
  newLayers.splice(newIndex, 0, removed);

  // Update orderIndex for all layers
  return newLayers.map((layer, index) => ({
    ...layer,
    orderIndex: index,
  }));
}

/**
 * Move layer up one position
 */
export function layerUp(layers: Layer[], layerId: string): Layer[] {
  const index = layers.findIndex((layer) => layer.$id === layerId);
  if (index === -1 || index >= layers.length - 1) {
    return layers;
  }

  const newLayers = [...layers];
  const temp = newLayers[index];
  newLayers[index] = newLayers[index + 1];
  newLayers[index + 1] = temp;

  // Update orderIndex
  return newLayers.map((layer, idx) => ({
    ...layer,
    orderIndex: idx,
  }));
}

/**
 * Move layer down one position
 */
export function layerDown(layers: Layer[], layerId: string): Layer[] {
  const index = layers.findIndex((layer) => layer.$id === layerId);
  if (index <= 0) {
    return layers;
  }

  const newLayers = [...layers];
  const temp = newLayers[index];
  newLayers[index] = newLayers[index - 1];
  newLayers[index - 1] = temp;

  // Update orderIndex
  return newLayers.map((layer, idx) => ({
    ...layer,
    orderIndex: idx,
  }));
}

/**
 * Move layer to the top
 */
export function layerToTop(layers: Layer[], layerId: string): Layer[] {
  const index = layers.findIndex((layer) => layer.$id === layerId);
  if (index === -1) {
    return layers;
  }

  const newLayers = [...layers];
  const [removed] = newLayers.splice(index, 1);
  newLayers.push(removed);

  // Update orderIndex
  return newLayers.map((layer, idx) => ({
    ...layer,
    orderIndex: idx,
  }));
}

/**
 * Move layer to the bottom
 */
export function layerToBottom(layers: Layer[], layerId: string): Layer[] {
  const index = layers.findIndex((layer) => layer.$id === layerId);
  if (index === -1) {
    return layers;
  }

  const newLayers = [...layers];
  const [removed] = newLayers.splice(index, 1);
  newLayers.unshift(removed);

  // Update orderIndex
  return newLayers.map((layer, idx) => ({
    ...layer,
    orderIndex: idx,
  }));
}

// ── Batch ordering (multi-select) ───────────────────────────────────────────

/**
 * Move multiple items one position forward, maintaining their relative order.
 * Items that are already at the top (or blocked by another selected item) stay put.
 */
export function bringForwardMulti(
  items: BoardItem[],
  selectedIds: string[],
): BoardItem[] {
  const result = [...items];
  // Process from highest index downward so earlier swaps don't shift later ones
  const indices = selectedIds
    .map((id) => result.findIndex((item) => item.$id === id))
    .filter((i) => i !== -1)
    .sort((a, b) => b - a);

  for (const index of indices) {
    if (
      index < result.length - 1 &&
      !selectedIds.includes(result[index + 1].$id)
    ) {
      const temp = result[index];
      result[index] = result[index + 1];
      result[index + 1] = temp;
    }
  }

  return result.map((item, idx) => ({ ...item, orderIndex: idx }));
}

/**
 * Move multiple items one position backward, maintaining their relative order.
 */
export function sendBackwardMulti(
  items: BoardItem[],
  selectedIds: string[],
): BoardItem[] {
  const result = [...items];
  const indices = selectedIds
    .map((id) => result.findIndex((item) => item.$id === id))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);

  for (const index of indices) {
    if (index > 0 && !selectedIds.includes(result[index - 1].$id)) {
      const temp = result[index];
      result[index] = result[index - 1];
      result[index - 1] = temp;
    }
  }

  return result.map((item, idx) => ({ ...item, orderIndex: idx }));
}

/**
 * Move multiple items to the front, maintaining their relative order among themselves.
 */
export function bringToFrontMulti(
  items: BoardItem[],
  selectedIds: string[],
): BoardItem[] {
  const selected = items.filter((i) => selectedIds.includes(i.$id));
  const unselected = items.filter((i) => !selectedIds.includes(i.$id));
  return [...unselected, ...selected].map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}

/**
 * Move multiple items to the back, maintaining their relative order among themselves.
 */
export function sendToBackMulti(
  items: BoardItem[],
  selectedIds: string[],
): BoardItem[] {
  const selected = items.filter((i) => selectedIds.includes(i.$id));
  const unselected = items.filter((i) => !selectedIds.includes(i.$id));
  return [...selected, ...unselected].map((item, idx) => ({
    ...item,
    orderIndex: idx,
  }));
}
