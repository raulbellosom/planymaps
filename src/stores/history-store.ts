/**
 * History Store - Undo/Redo System
 * Manages undo/redo for board operations with a 50-action limit
 */

import { create } from "zustand";
import type { Layer, BoardItem } from "@/types/board";

const MAX_HISTORY_SIZE = 50;

export type HistoryActionType =
  | "CREATE_LAYER"
  | "DELETE_LAYER"
  | "UPDATE_LAYER"
  | "REORDER_LAYERS"
  | "REORDER_ITEMS"
  | "MOVE_ITEM_TO_LAYER"
  | "TOGGLE_LAYER_VISIBILITY"
  | "TOGGLE_LAYER_LOCK"
  | "CHANGE_LAYER_OPACITY";

export interface HistoryEntry {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  description: string;
  // Previous state snapshot
  previousLayers?: Layer[];
  previousItemsByLayer?: Record<string, BoardItem[]>;
  // New state snapshot
  newLayers?: Layer[];
  newItemsByLayer?: Record<string, BoardItem[]>;
  // For single layer operations
  layerId?: string;
  previousLayerState?: Partial<Layer>;
  newLayerState?: Partial<Layer>;
  // For item moves
  itemId?: string;
  previousLayerId?: string;
  newLayerId?: string;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  isRecording: boolean;
}

interface HistoryActions {
  // Push a new entry to history
  pushEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;

  // Undo the last operation
  undo: () => HistoryEntry | null;

  // Redo the last undone operation
  redo: () => HistoryEntry | null;

  // Clear history
  clear: () => void;

  // Pause/resume recording (for batching)
  pauseRecording: () => void;
  resumeRecording: () => void;

  // Get history info
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useHistoryStore = create<HistoryState & HistoryActions>(
  (set, get) => ({
    // ============ STATE ============
    past: [],
    future: [],
    isRecording: true,

    // ============ ACTIONS ============
    pushEntry: (entry) => {
      if (!get().isRecording) return;

      const newEntry: HistoryEntry = {
        ...entry,
        id: generateId(),
        timestamp: Date.now(),
      };

      set((state) => {
        const newPast = [...state.past, newEntry];
        // Trim to max size
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast.shift();
        }
        return {
          past: newPast,
          future: [], // Clear redo stack on new action
        };
      });
    },

    undo: () => {
      const state = get();
      if (state.past.length === 0) return null;

      const lastEntry = state.past[state.past.length - 1];

      set({
        past: state.past.slice(0, -1),
        future: [lastEntry, ...state.future],
      });

      return lastEntry;
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return null;

      const nextEntry = state.future[0];

      set({
        past: [...state.past, nextEntry],
        future: state.future.slice(1),
      });

      return nextEntry;
    },

    clear: () => {
      set({ past: [], future: [] });
    },

    pauseRecording: () => {
      set({ isRecording: false });
    },

    resumeRecording: () => {
      set({ isRecording: true });
    },

    canUndo: () => get().past.length > 0,

    canRedo: () => get().future.length > 0,

    getUndoDescription: () => {
      const state = get();
      if (state.past.length === 0) return null;
      return state.past[state.past.length - 1].description;
    },

    getRedoDescription: () => {
      const state = get();
      if (state.future.length === 0) return null;
      return state.future[0].description;
    },
  }),
);

// Helper hook to capture current state before an action
export function useCaptureHistory() {
  const { pushEntry } = useHistoryStore();

  const captureLayerCreate = (
    newLayer: Layer,
    allLayers: Layer[],
    allItems: Record<string, BoardItem[]>,
  ) => {
    pushEntry({
      type: "CREATE_LAYER",
      description: `Create layer "${newLayer.name}"`,
      previousLayers: allLayers.filter((l) => l.$id !== newLayer.$id),
      newLayers: allLayers,
      previousItemsByLayer: Object.fromEntries(
        Object.entries(allItems).filter(([key]) => key !== newLayer.$id),
      ),
      newItemsByLayer: allItems,
    });
  };

  const captureLayerDelete = (
    deletedLayer: Layer,
    layerItems: BoardItem[],
    previousLayers: Layer[],
    previousItemsByLayer: Record<string, BoardItem[]>,
    currentLayers: Layer[],
    currentItemsByLayer: Record<string, BoardItem[]>,
  ) => {
    pushEntry({
      type: "DELETE_LAYER",
      description: `Delete layer "${deletedLayer.name}"`,
      previousLayers,
      previousItemsByLayer,
      newLayers: currentLayers,
      newItemsByLayer: currentItemsByLayer,
      layerId: deletedLayer.$id,
    });
  };

  const captureLayerUpdate = (
    layerId: string,
    previousState: Partial<Layer>,
    newState: Partial<Layer>,
    description: string,
  ) => {
    pushEntry({
      type: "UPDATE_LAYER",
      description,
      layerId,
      previousLayerState: previousState,
      newLayerState: newState,
    });
  };

  const captureLayerReorder = (
    previousLayers: Layer[],
    newLayers: Layer[],
    description: string = "Reorder layers",
  ) => {
    pushEntry({
      type: "REORDER_LAYERS",
      description,
      previousLayers,
      newLayers,
    });
  };

  const captureItemMove = (
    itemId: string,
    fromLayerId: string,
    toLayerId: string,
    previousItemsByLayer: Record<string, BoardItem[]>,
    newItemsByLayer: Record<string, BoardItem[]>,
  ) => {
    pushEntry({
      type: "MOVE_ITEM_TO_LAYER",
      description: "Move item to layer",
      previousItemsByLayer,
      newItemsByLayer,
      itemId,
      previousLayerId: fromLayerId,
      newLayerId: toLayerId,
    });
  };

  return {
    captureLayerCreate,
    captureLayerDelete,
    captureLayerUpdate,
    captureLayerReorder,
    captureItemMove,
  };
}

// Selector helpers
export const selectCanUndo = (state: HistoryState) => state.past.length > 0;
export const selectCanRedo = (state: HistoryState) => state.future.length > 0;
export const selectUndoCount = (state: HistoryState) => state.past.length;
export const selectRedoCount = (state: HistoryState) => state.future.length;
