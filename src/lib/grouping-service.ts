/**
 * Grouping Service
 * Functions for grouping and ungrouping items
 */

import type { BoardItem } from "@/types/board";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a group from selected items
 * Returns the group item and updated items with parentGroupId set
 */
export function createGroup(
  items: BoardItem[],
  selectedIds: string[],
  layerId: string,
  boardId: string,
  createdBy: string,
): { group: BoardItem; updatedItems: BoardItem[] } {
  // Filter to only selected items
  const selectedItems = items.filter((item) => selectedIds.includes(item.$id));
  if (selectedItems.length < 2) {
    throw new Error("Need at least 2 items to create a group");
  }

  // Calculate bounding box of all selected items
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const item of selectedItems) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  }

  const now = new Date().toISOString();
  const groupId = uuidv4();

  // Create the group item
  const group: BoardItem = {
    $id: groupId,
    boardId,
    layerId,
    type: "group",
    name: `Group ${selectedItems.length}`,
    orderIndex: Math.max(...selectedItems.map((i) => i.orderIndex)) + 1,
    visible: true,
    locked: false,
    opacity: 1,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    styleJson: JSON.stringify({}),
    contentJson: JSON.stringify({ childIds: selectedIds }),
    interactionJson: JSON.stringify({ selectable: true, draggable: true }),
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  // Update selected items to reference the group
  const updatedItems = selectedItems.map((item) => ({
    ...item,
    parentGroupId: groupId,
    updatedAt: now,
  }));

  return { group, updatedItems };
}

/**
 * Ungroup items - remove parent group reference from children
 * The group item itself is not deleted, just the relationship is broken
 */
export function ungroupItems(items: BoardItem[], groupId: string): BoardItem[] {
  return items.map((item) => {
    if (item.parentGroupId === groupId) {
      return {
        ...item,
        parentGroupId: undefined,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
}

/**
 * Get all children of a group
 */
export function getGroupChildren(
  items: BoardItem[],
  groupId: string,
): BoardItem[] {
  return items.filter((item) => item.parentGroupId === groupId);
}

/**
 * Calculate the bounding box of a group based on its children
 */
export function calculateGroupBounds(
  items: BoardItem[],
  groupId: string,
): { x: number; y: number; width: number; height: number } | null {
  const children = getGroupChildren(items, groupId);
  if (children.length === 0) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const item of children) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Move all items in a group by the same delta
 */
export function moveGroupItems(
  items: BoardItem[],
  groupId: string,
  deltaX: number,
  deltaY: number,
): BoardItem[] {
  return items.map((item) => {
    if (item.parentGroupId === groupId) {
      return {
        ...item,
        x: item.x + deltaX,
        y: item.y + deltaY,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
}

/**
 * Check if an item is part of a group
 */
export function isGrouped(item: BoardItem): boolean {
  return !!item.parentGroupId;
}

/**
 * Check if an item is a group container
 */
export function isGroup(item: BoardItem): boolean {
  return item.type === "group";
}
