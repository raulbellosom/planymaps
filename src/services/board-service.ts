/**
 * Board Service
 * Provides CRUD operations for boards, layers, and items
 */

import { getDatabases } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import { Query } from "appwrite";
import type {
  Board,
  Layer,
  BoardItem,
  CreateBoardInput,
  CreateLayerInput,
  CreateItemInput,
  StyleProps,
  ContentProps,
  InteractionProps,
  Transform,
} from "@/types/board";
import {
  defaultTransform,
  defaultStyle,
  defaultContent,
  defaultInteraction,
} from "@/types/board";

// ============ BOARD OPERATIONS ============

/**
 * Create a new board
 */
export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("boards"),
    "unique()",
    {
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description || "",
      mode: input.mode || "visual",
      width: input.width || 1920,
      height: input.height || 1080,
      backgroundType: input.backgroundType || "none",
      backgroundColor: input.backgroundColor || "#ffffff",
      backgroundAssetId: input.backgroundAssetId || null,
      isArchived: false,
      ownerId: input.createdBy,
      createdBy: input.createdBy,
    },
  );
  return response as unknown as Board;
}

/**
 * Get a board by ID
 */
export async function getBoard(boardId: string): Promise<Board> {
  const response = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("boards"),
    boardId,
  );
  return response as unknown as Board;
}

/**
 * List boards for a workspace
 */
export async function listWorkspaceBoards(
  workspaceId: string,
): Promise<Board[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("boards"),
    [Query.equal("workspaceId", workspaceId), Query.equal("isArchived", false)],
  );
  return response.documents as unknown as Board[];
}

/**
 * Update a board
 */
export async function updateBoard(
  boardId: string,
  data: Partial<
    Pick<
      Board,
      | "name"
      | "description"
      | "backgroundType"
      | "backgroundColor"
      | "backgroundAssetId"
      | "thumbnailFileId"
      | "viewportState"
    >
  >,
): Promise<Board> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("boards"),
    boardId,
    {
      ...data,
    },
  );
  return response as unknown as Board;
}

/**
 * Archive a board (soft delete)
 */
export async function archiveBoard(boardId: string): Promise<Board> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("boards"),
    boardId,
    {
      isArchived: true,
    },
  );
  return response as unknown as Board;
}

/**
 * Delete a board permanently (hard delete - use with caution)
 * This will also delete all associated layers and items
 */
export async function deleteBoard(boardId: string): Promise<void> {
  // First delete all items belonging to this board
  const items = await listBoardItems(boardId);
  for (const item of items) {
    await getDatabases().deleteDocument(
      getDatabaseId(),
      getCollectionId("board_items"),
      item.$id,
    );
  }

  // Then delete all layers belonging to this board
  const layers = await listBoardLayers(boardId);
  for (const layer of layers) {
    await getDatabases().deleteDocument(
      getDatabaseId(),
      getCollectionId("board_layers"),
      layer.$id,
    );
  }

  // Finally delete the board itself
  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("boards"),
    boardId,
  );
}

// ============ LAYER OPERATIONS ============

/**
 * Create a new layer
 */
export async function createLayer(
  boardId: string,
  name: string,
  orderIndex: number,
  documentId: string = "unique()",
): Promise<Layer> {
  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("board_layers"),
    documentId,
    {
      boardId,
      name,
      order: orderIndex,
      visible: true,
      locked: false,
      opacity: 1,
    },
  );
  return response as unknown as Layer;
}

/**
 * Get a layer by ID
 */
export async function getLayer(layerId: string): Promise<Layer> {
  const response = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("board_layers"),
    layerId,
  );
  return response as unknown as Layer;
}

/**
 * List layers for a board (ordered by orderIndex)
 */
export async function listBoardLayers(boardId: string): Promise<Layer[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("board_layers"),
    [Query.equal("boardId", boardId), Query.orderAsc("order")],
  );
  return response.documents as unknown as Layer[];
}

/**
 * Update a layer
 */
export async function updateLayer(
  layerId: string,
  data: Partial<
    Pick<Layer, "name" | "order" | "visible" | "locked" | "opacity">
  >,
): Promise<Layer> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_layers"),
    layerId,
    {
      ...data,
    },
  );
  return response as unknown as Layer;
}

/**
 * Delete a layer
 */
export async function deleteLayer(layerId: string): Promise<void> {
  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("board_layers"),
    layerId,
  );
}

/**
 * Reorder layers
 */
export async function reorderLayers(
  boardId: string,
  layerIds: string[],
): Promise<void> {
  // Update each layer with its new order
  for (let i = 0; i < layerIds.length; i++) {
    await getDatabases().updateDocument(
      getDatabaseId(),
      getCollectionId("board_layers"),
      layerIds[i],
      { order: i },
    );
  }
}

// ============ ITEM OPERATIONS ============

/**
 * Create a new board item
 */
export async function createItem(
  boardId: string,
  layerId: string,
  type: CreateItemInput["type"],
  name: string,
  orderIndex: number,
  transform?: Partial<Transform>,
  style?: Partial<StyleProps>,
  content?: Partial<ContentProps>,
  createdBy?: string,
  documentId: string = "unique()",
): Promise<BoardItem> {
  const mergedTransform = { ...defaultTransform, ...transform };
  const mergedStyle = { ...defaultStyle, ...style };
  const mergedContent = { ...defaultContent, ...content };

  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    documentId,
    {
      boardId,
      layerId,
      type,
      name,
      orderIndex,
      visible: true,
      locked: false,
      opacity: 1,
      x: mergedTransform.x,
      y: mergedTransform.y,
      width: mergedTransform.width,
      height: mergedTransform.height,
      rotation: mergedTransform.rotation,
      scaleX: mergedTransform.scaleX,
      scaleY: mergedTransform.scaleY,
      styleJson: JSON.stringify(mergedStyle),
      contentJson: JSON.stringify(mergedContent),
      interactionJson: JSON.stringify(defaultInteraction),
      createdBy: createdBy || "",
    },
  );
  return response as unknown as BoardItem;
}

/**
 * Get an item by ID
 */
export async function getItem(itemId: string): Promise<BoardItem> {
  const response = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
  );
  return response as unknown as BoardItem;
}

/**
 * List items for a layer
 * @param layerId - The layer ID to list items for
 * @param limit - Maximum number of items to return (default 100)
 * @param offset - Offset for pagination (default 0)
 */
export async function listLayerItems(
  layerId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<BoardItem[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("board_items"),
    [
      Query.equal("layerId", layerId),
      Query.orderAsc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ],
  );
  return response.documents as unknown as BoardItem[];
}

/**
 * List all items for a board
 * @param boardId - The board ID to list items for
 * @param limit - Maximum number of items to return (default 100)
 * @param offset - Offset for pagination (default 0)
 */
export async function listBoardItems(
  boardId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<BoardItem[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("board_items"),
    [
      Query.equal("boardId", boardId),
      Query.orderAsc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ],
  );
  return response.documents as unknown as BoardItem[];
}

/**
 * Update an item's transform
 */
export async function updateItemTransform(
  itemId: string,
  transform: Partial<Transform>,
): Promise<BoardItem> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
    {
      ...transform,
    },
  );
  return response as unknown as BoardItem;
}

/**
 * Update an item's style
 */
export async function updateItemStyle(
  itemId: string,
  style: Partial<StyleProps>,
): Promise<BoardItem> {
  // Get current item to merge styles
  const item = await getItem(itemId);
  const currentStyle = JSON.parse(item.styleJson || "{}");
  const mergedStyle = { ...currentStyle, ...style };

  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
    {
      styleJson: JSON.stringify(mergedStyle),
    },
  );
  return response as unknown as BoardItem;
}

/**
 * Update an item's visibility, locked, opacity
 */
export async function updateItemState(
  itemId: string,
  data: { visible?: boolean; locked?: boolean; opacity?: number },
): Promise<BoardItem> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
    {
      ...data,
    },
  );
  return response as unknown as BoardItem;
}

/**
 * Hard delete an item
 */
export async function deleteItem(itemId: string): Promise<void> {
  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
  );
}

/**
 * Move item to a different layer
 */
export async function moveItemToLayer(
  itemId: string,
  newLayerId: string,
  newOrderIndex: number,
): Promise<BoardItem> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_items"),
    itemId,
    {
      layerId: newLayerId,
      orderIndex: newOrderIndex,
    },
  );
  return response as unknown as BoardItem;
}

/**
 * Group items (set parentGroupId)
 */
export async function groupItems(
  itemIds: string[],
  groupId: string,
): Promise<void> {
  for (const itemId of itemIds) {
    await getDatabases().updateDocument(
      getDatabaseId(),
      getCollectionId("board_items"),
      itemId,
      { parentGroupId: groupId },
    );
  }
}

/**
 * Ungroup items (remove parentGroupId)
 */
export async function ungroupItems(itemIds: string[]): Promise<void> {
  for (const itemId of itemIds) {
    await getDatabases().updateDocument(
      getDatabaseId(),
      getCollectionId("board_items"),
      itemId,
      { parentGroupId: "" },
    );
  }
}
