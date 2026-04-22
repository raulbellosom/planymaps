/**
 * Board Store - Persisted State
 * Manages the persisted board entities (board, layers, items)
 */

import { create } from "zustand";
import { ID } from "appwrite";
import type { Board, Layer, BoardItem, ItemType } from "@/types/board";
import { updateBoard as updateBoardApi } from "@/services/board-service";

// Persisted state interface
interface BoardState {
  // Current board
  board: Board | null;
  boards: Board[];

  // Layers (ordered)
  layers: Layer[];

  // Items (grouped by layer)
  itemsByLayer: Record<string, BoardItem[]>;

  // Loading/error state
  isLoading: boolean;
  error: string | null;

  // Dirty flag (unsaved changes)
  isDirty: boolean;
}

// Actions interface
interface BoardActions {
  // Board actions
  setBoard: (board: Board | null) => void;
  updateBoard: (updates: Partial<Board>) => void;
  renameBoard: (boardId: string, name: string) => Promise<Board>;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  loadBoard: (board: Board, layers: Layer[], items: BoardItem[]) => void;
  clearBoard: () => void;

  // Layer actions
  addLayer: (layer: Layer) => void;
  createLayer: (boardId: string, name?: string) => Layer;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (layerId: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  setLayers: (layers: Layer[]) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  renameLayer: (layerId: string, name: string) => void;
  duplicateLayer: (layerId: string) => Layer | null;

  // Item actions
  addItem: (layerId: string, item: BoardItem) => void;
  updateItem: (itemId: string, updates: Partial<BoardItem>) => void;
  removeItem: (itemId: string) => void;
  moveItem: (
    itemId: string,
    fromLayerId: string,
    toLayerId: string,
    newIndex: number,
  ) => void;
  setItems: (layerId: string, items: BoardItem[]) => void;
  reorderItems: (layerId: string, itemIds: string[]) => void;
  moveItemToLayer: (itemId: string, toLayerId: string) => void;
  duplicateItem: (itemId: string) => BoardItem | null;
  groupItems: (itemIds: string[]) => string | null;
  ungroupItems: (groupId: string) => void;

  // Geo actions
  updateItemGeo: (itemId: string, geoJson: string) => void;

  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setDirty: (isDirty: boolean) => void;
  reset: () => void;
}

// Initial state
const initialState: BoardState = {
  board: null,
  boards: [],
  layers: [],
  itemsByLayer: {},
  isLoading: false,
  error: null,
  isDirty: false,
};

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  // ============ STATE ============
  ...initialState,

  // ============ BOARD ACTIONS ============
  setBoard: (board) => set({ board }),
  updateBoard: (updates) =>
    set((state) => ({
      board: state.board ? { ...state.board, ...updates } : null,
      isDirty: true,
    })),
  renameBoard: async (boardId, name) => {
    try {
      const updated = await updateBoardApi(boardId, { name });
      set((state) => ({
        board:
          state.board?.$id === boardId
            ? { ...state.board, name: updated.name }
            : state.board,
        boards: state.boards.map((b) =>
          b.$id === boardId ? { ...b, name: updated.name } : b,
        ),
      }));
      return updated;
    } catch (error) {
      console.error("Failed to rename board:", error);
      throw error;
    }
  },
  setBoards: (boards) => set({ boards }),
  addBoard: (board) =>
    set((state) => ({
      boards: [...state.boards, board],
    })),
  removeBoard: (boardId) =>
    set((state) => ({
      boards: state.boards.filter((b) => b.$id !== boardId),
    })),

  loadBoard: (board, layers, items) => {
    // Group items by layer
    const itemsByLayer: Record<string, BoardItem[]> = {};
    for (const layer of layers) {
      itemsByLayer[layer.$id] = [];
    }
    for (const item of items) {
      if (itemsByLayer[item.layerId]) {
        itemsByLayer[item.layerId].push(item);
      }
    }
    // Sort items by order within each layer
    for (const layerId of Object.keys(itemsByLayer)) {
      itemsByLayer[layerId].sort((a, b) => a.orderIndex - b.orderIndex);
    }

    set({
      board,
      layers,
      itemsByLayer,
      isLoading: false,
      error: null,
      isDirty: false,
    });
  },

  clearBoard: () =>
    set({
      board: null,
      layers: [],
      itemsByLayer: {},
      isDirty: false,
    }),

  // ============ LAYER ACTIONS ============
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
      itemsByLayer: { ...state.itemsByLayer, [layer.$id]: [] },
      isDirty: true,
    })),

  updateLayer: (layerId, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.$id === layerId ? { ...l, ...updates } : l,
      ),
      isDirty: true,
    })),

  removeLayer: (layerId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [layerId]: _, ...remainingItems } = state.itemsByLayer;
      return {
        layers: state.layers.filter((l) => l.$id !== layerId),
        itemsByLayer: remainingItems,
        isDirty: true,
      };
    }),

  reorderLayers: (layerIds) =>
    set((state) => {
      const layerMap = new Map(state.layers.map((l) => [l.$id, l]));
      const reorderedLayers = layerIds
        .map((id) => layerMap.get(id))
        .filter((l): l is Layer => l !== undefined)
        .map((l, index) => ({ ...l, order: index }));
      return { layers: reorderedLayers, isDirty: true };
    }),

  setLayers: (layers) => set({ layers }),

  createLayer: (boardId, name) => {
    const state = get();

    // Calculate next layer number for auto-naming
    const existingLayerNumbers = state.layers
      .map((l) => {
        const match = l.name.match(/^Layer (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    const maxLayerNum = Math.max(0, ...existingLayerNumbers);
    const layerName = name || `Layer ${maxLayerNum + 1}`;

    // Calculate order index (append to end)
    const order = state.layers.length;

    const now = new Date().toISOString();
    const newLayer: Layer = {
      $id: ID.unique(),
      boardId,
      name: layerName,
      order,
      visible: true,
      locked: false,
      opacity: 1,
      createdAt: now,
      updatedAt: now,
    };

    set((s) => ({
      layers: [...s.layers, newLayer],
      itemsByLayer: { ...s.itemsByLayer, [newLayer.$id]: [] },
      isDirty: true,
    }));

    return newLayer;
  },

  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.$id === layerId
          ? { ...l, visible: !l.visible, updatedAt: new Date().toISOString() }
          : l,
      ),
      isDirty: true,
    })),

  toggleLayerLock: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.$id === layerId
          ? { ...l, locked: !l.locked, updatedAt: new Date().toISOString() }
          : l,
      ),
      isDirty: true,
    })),

  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.$id === layerId
          ? {
              ...l,
              opacity: Math.max(0, Math.min(1, opacity)),
              updatedAt: new Date().toISOString(),
            }
          : l,
      ),
      isDirty: true,
    })),

  renameLayer: (layerId, name) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.$id === layerId
          ? { ...l, name, updatedAt: new Date().toISOString() }
          : l,
      ),
      isDirty: true,
    })),

  duplicateLayer: (layerId) => {
    const state = get();
    const sourceLayer = state.layers.find((l) => l.$id === layerId);
    if (!sourceLayer) return null;

    const now = new Date().toISOString();
    const newLayer: Layer = {
      ...sourceLayer,
      $id: ID.unique(),
      name: `${sourceLayer.name} Copy`,
      order: state.layers.length,
      createdAt: now,
      updatedAt: now,
    };

    // Clone items from source layer
    const sourceItems = state.itemsByLayer[layerId] || [];
    const clonedItems = sourceItems.map((item) => ({
      ...item,
      $id: ID.unique(),
      layerId: newLayer.$id,
      createdAt: now,
      updatedAt: now,
    }));

    set((s) => ({
      layers: [...s.layers, newLayer],
      itemsByLayer: {
        ...s.itemsByLayer,
        [newLayer.$id]: clonedItems,
      },
      isDirty: true,
    }));

    return newLayer;
  },

  moveItemToLayer: (itemId, toLayerId) =>
    set((state) => {
      const newItemsByLayer = { ...state.itemsByLayer };
      let item: BoardItem | null = null;

      // Find and remove item from source layer
      for (const layerId of Object.keys(newItemsByLayer)) {
        const items = newItemsByLayer[layerId];
        const index = items.findIndex((i) => i.$id === itemId);
        if (index !== -1) {
          [item] = items.splice(index, 1);
          break;
        }
      }

      if (!item) return state;

      // Add to target layer
      item.layerId = toLayerId;
      item.orderIndex = newItemsByLayer[toLayerId]?.length || 0;
      newItemsByLayer[toLayerId] = [
        ...(newItemsByLayer[toLayerId] || []),
        item,
      ];

      return { itemsByLayer: newItemsByLayer, isDirty: true };
    }),

  // ============ ITEM ACTIONS ============
  addItem: (layerId, item) =>
    set((state) => ({
      itemsByLayer: {
        ...state.itemsByLayer,
        [layerId]: [...(state.itemsByLayer[layerId] || []), item],
      },
      isDirty: true,
    })),

  updateItem: (itemId, updates) =>
    set((state) => {
      const newItemsByLayer = { ...state.itemsByLayer };
      for (const layerId of Object.keys(newItemsByLayer)) {
        const items = newItemsByLayer[layerId];
        const index = items.findIndex((i) => i.$id === itemId);
        if (index !== -1) {
          newItemsByLayer[layerId] = [
            ...items.slice(0, index),
            { ...items[index], ...updates },
            ...items.slice(index + 1),
          ];
          break;
        }
      }
      return { itemsByLayer: newItemsByLayer, isDirty: true };
    }),

  removeItem: (itemId) =>
    set((state) => {
      const newItemsByLayer = { ...state.itemsByLayer };
      for (const layerId of Object.keys(newItemsByLayer)) {
        const items = newItemsByLayer[layerId];
        const filteredItems = items.filter((i) => i.$id !== itemId);
        if (filteredItems.length !== items.length) {
          newItemsByLayer[layerId] = filteredItems;
          break;
        }
      }
      return { itemsByLayer: newItemsByLayer, isDirty: true };
    }),

  moveItem: (itemId, fromLayerId, toLayerId, newIndex) =>
    set((state) => {
      const newItemsByLayer = { ...state.itemsByLayer };

      // Find and remove item from source layer
      const sourceItems = [...(newItemsByLayer[fromLayerId] || [])];
      const itemIndex = sourceItems.findIndex((i) => i.$id === itemId);
      if (itemIndex === -1) return state;

      const [item] = sourceItems.splice(itemIndex, 1);
      newItemsByLayer[fromLayerId] = sourceItems;

      // Add to target layer
      const targetItems = [...(newItemsByLayer[toLayerId] || [])];
      item.layerId = toLayerId;
      item.orderIndex = newIndex;
      targetItems.splice(newIndex, 0, item);
      newItemsByLayer[toLayerId] = targetItems;

      return { itemsByLayer: newItemsByLayer, isDirty: true };
    }),

  setItems: (layerId, items) =>
    set((state) => ({
      itemsByLayer: { ...state.itemsByLayer, [layerId]: items },
    })),

  reorderItems: (layerId, itemIds) =>
    set((state) => {
      const items = state.itemsByLayer[layerId] || [];
      const itemMap = new Map(items.map((i) => [i.$id, i]));
      const reorderedItems = itemIds
        .map((id) => itemMap.get(id))
        .filter((i): i is BoardItem => i !== undefined)
        .map((item, index) => ({ ...item, orderIndex: index }));

      return {
        itemsByLayer: { ...state.itemsByLayer, [layerId]: reorderedItems },
        isDirty: true,
      };
    }),

  duplicateItem: (itemId) => {
    const state = get();
    let foundItem: BoardItem | null = null;

    for (const items of Object.values(state.itemsByLayer)) {
      const item = items.find((i) => i.$id === itemId);
      if (item) {
        foundItem = item;
        break;
      }
    }

    if (!foundItem) return null;

    const now = new Date().toISOString();
    const newItem: BoardItem = {
      ...foundItem,
      $id: ID.unique(),
      name: `${foundItem.name} Copy`,
      x: foundItem.x + 16,
      y: foundItem.y + 16,
      orderIndex: (state.itemsByLayer[foundItem.layerId]?.length || 0) + 1,
      createdAt: now,
      updatedAt: now,
    };

    set((s) => ({
      itemsByLayer: {
        ...s.itemsByLayer,
        [newItem.layerId]: [
          ...(s.itemsByLayer[newItem.layerId] || []),
          newItem,
        ],
      },
      isDirty: true,
    }));

    return newItem;
  },

  groupItems: (itemIds) => {
    const state = get();
    if (itemIds.length < 2 || !state.board) return null;

    // Collect items and tally which layer each belongs to
    const itemLayerMap = new Map<string, string>(); // itemId → layerId
    const layerCount = new Map<string, number>(); // layerId → count of selected items

    for (const id of itemIds) {
      for (const [lid, layerItems] of Object.entries(state.itemsByLayer)) {
        if (layerItems.some((i) => i.$id === id)) {
          itemLayerMap.set(id, lid);
          layerCount.set(lid, (layerCount.get(lid) ?? 0) + 1);
          break;
        }
      }
    }

    if (itemLayerMap.size < itemIds.length) return null; // some items not found

    // Pick the target layer: the one that already contains the most selected items
    // (falls back to the first item's layer when tied)
    let targetLayerId: string = itemLayerMap.get(itemIds[0])!;
    let maxCount = 0;
    for (const [lid, count] of layerCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        targetLayerId = lid;
      }
    }

    // Build a mutable snapshot of itemsByLayer so we can move items cross-layer
    const newItemsByLayer: Record<string, BoardItem[]> = Object.fromEntries(
      Object.entries(state.itemsByLayer).map(([k, v]) => [k, [...v]]),
    );

    const items: BoardItem[] = [];
    for (const id of itemIds) {
      const srcLayerId = itemLayerMap.get(id)!;
      if (srcLayerId !== targetLayerId) {
        // Move item to target layer
        const srcArr = newItemsByLayer[srcLayerId];
        const idx = srcArr.findIndex((i) => i.$id === id);
        if (idx === -1) continue;
        const [moved] = srcArr.splice(idx, 1);
        const updated = { ...moved, layerId: targetLayerId };
        newItemsByLayer[targetLayerId] = [
          ...(newItemsByLayer[targetLayerId] ?? []),
          updated,
        ];
        items.push(updated);
      } else {
        const found = newItemsByLayer[targetLayerId].find((i) => i.$id === id);
        if (found) items.push(found);
      }
    }

    if (items.length < 2) return null;

    // Bounding box
    const minX = Math.min(...items.map((i) => i.x));
    const minY = Math.min(...items.map((i) => i.y));
    const maxX = Math.max(...items.map((i) => i.x + i.width));
    const maxY = Math.max(...items.map((i) => i.y + i.height));

    const now = new Date().toISOString();
    const groupId = ID.unique();

    const groupItem: BoardItem = {
      $id: groupId,
      boardId: state.board.$id,
      layerId: targetLayerId,
      type: "group",
      name: `Group`,
      orderIndex: Math.max(...items.map((i) => i.orderIndex)) + 1,
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
      styleJson: "{}",
      contentJson: "{}",
      interactionJson: JSON.stringify({ selectable: true, draggable: true }),
      createdBy: items[0].createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Tag children with their group id
    newItemsByLayer[targetLayerId] = newItemsByLayer[targetLayerId].map(
      (item) => {
        if (itemIds.includes(item.$id)) {
          return {
            ...item,
            parentGroupId: groupId,
            layerId: targetLayerId,
            updatedAt: now,
          };
        }
        return item;
      },
    );
    newItemsByLayer[targetLayerId] = [
      ...newItemsByLayer[targetLayerId],
      groupItem,
    ];

    set(() => ({
      itemsByLayer: newItemsByLayer,
      isDirty: true,
    }));

    return groupId;
  },

  ungroupItems: (groupId) => {
    const state = get();

    for (const [layerId, items] of Object.entries(state.itemsByLayer)) {
      const groupItem = items.find(
        (i) => i.$id === groupId && i.type === "group",
      );
      if (!groupItem) continue;

      const now = new Date().toISOString();
      const updatedItems = items
        .filter((i) => i.$id !== groupId) // remove the group item
        .map((item) => {
          if (item.parentGroupId === groupId) {
            return { ...item, parentGroupId: undefined, updatedAt: now };
          }
          return item;
        });

      set((s) => ({
        itemsByLayer: {
          ...s.itemsByLayer,
          [layerId]: updatedItems,
        },
        isDirty: true,
      }));
      return;
    }
  },

  // ============ GEO ACTIONS ============
  updateItemGeo: (itemId, geoJson) =>
    set((state) => {
      const newItemsByLayer = { ...state.itemsByLayer };
      for (const layerId of Object.keys(newItemsByLayer)) {
        const items = newItemsByLayer[layerId];
        const index = items.findIndex((i) => i.$id === itemId);
        if (index !== -1) {
          newItemsByLayer[layerId] = [
            ...items.slice(0, index),
            { ...items[index], geoJson },
            ...items.slice(index + 1),
          ];
          break;
        }
      }
      return { itemsByLayer: newItemsByLayer, isDirty: true };
    }),

  // ============ STATE MANAGEMENT ============
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDirty: (isDirty) => set({ isDirty }),
  reset: () => set(initialState),
}));

// Selectors
export const selectBoard = (state: BoardState) => state.board;
export const selectLayers = (state: BoardState) => state.layers;
export const selectLayersById = (state: BoardState) =>
  new Map(state.layers.map((l) => [l.$id, l]));

export const selectItemsForLayer = (layerId: string) => (state: BoardState) =>
  state.itemsByLayer[layerId] || [];

export const selectAllItems = (state: BoardState) =>
  Object.values(state.itemsByLayer).flat();

export const selectItemById = (itemId: string) => (state: BoardState) => {
  for (const items of Object.values(state.itemsByLayer)) {
    const item = items.find((i) => i.$id === itemId);
    if (item) return item;
  }
  return null;
};

export const selectIsDirty = (state: BoardState) => state.isDirty;
export const selectIsLoading = (state: BoardState) => state.isLoading;
export const selectError = (state: BoardState) => state.error;
