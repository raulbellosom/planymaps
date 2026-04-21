/**
 * UI Store - Transient State
 * Manages transient UI state (selection, viewport, tool, gesture)
 */

import { create } from "zustand";
import type { ItemType } from "@/types/board";
import type React from "react";

// Tool types
export type ToolType =
  | "select"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "image"
  | "pin"
  | "hand"; // pan tool

// Viewport state
export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

// Transient UI state interface
interface UIState {
  // Selection state
  selectedItemIds: string[];
  selectedLayerId: string | null;

  // Viewport state
  viewport: ViewportState;

  // Tool state
  activeTool: ToolType;

  // Gesture state (for mobile/touch)
  isDrawing: boolean;
  isPanning: boolean;
  activeGesture: string | null;

  // Context menu
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTargetId: string | null;

  // Panels
  isPanelCollapsed: boolean;

  // Pin hover popover
  pinPopover: {
    x: number;
    y: number;
    label: string;
    note: string;
    images: string[];
  } | null;

  // Pin edit modal (double-click to open)
  pinEditModal: { itemId: string } | null;

  // Text inline editor
  textEdit: {
    itemId: string;
    text: string;
    textareaStyle: React.CSSProperties;
  } | null;
}

// Actions interface
interface UIActions {
  // Selection actions
  selectItem: (itemId: string, addToSelection?: boolean) => void;
  selectItems: (itemIds: string[]) => void;
  deselectItem: (itemId: string) => void;
  clearSelection: () => void;
  selectLayer: (layerId: string | null) => void;

  // Viewport actions
  setViewport: (viewport: Partial<ViewportState>) => void;
  zoomIn: (centerX?: number, centerY?: number) => void;
  zoomOut: (centerX?: number, centerY?: number) => void;
  resetViewport: () => void;
  pan: (deltaX: number, deltaY: number) => void;

  // Tool actions
  setActiveTool: (tool: ToolType) => void;

  // Gesture actions
  setIsDrawing: (isDrawing: boolean) => void;
  setIsPanning: (isPanning: boolean) => void;
  setActiveGesture: (gesture: string | null) => void;

  // Context menu actions
  showContextMenu: (x: number, y: number, targetId: string) => void;
  hideContextMenu: () => void;

  // Panel actions
  togglePanel: () => void;

  // Pin popover actions
  setPinPopover: (popover: UIState["pinPopover"]) => void;

  // Pin edit modal actions
  setPinEditModal: (modal: UIState["pinEditModal"]) => void;

  // Text editor actions
  setTextEdit: (edit: UIState["textEdit"]) => void;

  // State management
  reset: () => void;
}

// Initial state
const initialState: UIState = {
  selectedItemIds: [],
  selectedLayerId: null,
  viewport: { x: 0, y: 0, scale: 1 },
  activeTool: "select",
  isDrawing: false,
  isPanning: false,
  activeGesture: null,
  contextMenuPosition: null,
  contextMenuTargetId: null,
  isPanelCollapsed: false,
  pinPopover: null,
  pinEditModal: null,
  textEdit: null,
};

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // ============ STATE ============
  ...initialState,

  // ============ SELECTION ACTIONS ============
  selectItem: (itemId, addToSelection = false) =>
    set((state) => {
      if (addToSelection) {
        // Toggle: if already selected, deselect; otherwise add to selection
        if (state.selectedItemIds.includes(itemId)) {
          return {
            selectedItemIds: state.selectedItemIds.filter(
              (id) => id !== itemId,
            ),
          };
        }
        return { selectedItemIds: [...state.selectedItemIds, itemId] };
      }
      // Replace selection
      return { selectedItemIds: [itemId] };
    }),

  selectItems: (itemIds) => set({ selectedItemIds: itemIds }),

  deselectItem: (itemId) =>
    set((state) => ({
      selectedItemIds: state.selectedItemIds.filter((id) => id !== itemId),
    })),

  clearSelection: () => set({ selectedItemIds: [] }),

  selectLayer: (layerId) => set({ selectedLayerId: layerId }),

  // ============ VIEWPORT ACTIONS ============
  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  zoomIn: (centerX?: number, centerY?: number) =>
    set((state) => {
      const oldScale = state.viewport.scale;
      const newScale = Math.min(oldScale * 1.2, 5);

      // If center point provided, adjust viewport to keep that point centered
      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / oldScale;
        return {
          viewport: {
            x: centerX - (centerX - state.viewport.x) * scaleRatio,
            y: centerY - (centerY - state.viewport.y) * scaleRatio,
            scale: newScale,
          },
        };
      }

      return {
        viewport: {
          ...state.viewport,
          scale: newScale,
        },
      };
    }),

  zoomOut: (centerX?: number, centerY?: number) =>
    set((state) => {
      const oldScale = state.viewport.scale;
      const newScale = Math.max(oldScale / 1.2, 0.1);

      // If center point provided, adjust viewport to keep that point centered
      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / oldScale;
        return {
          viewport: {
            x: centerX - (centerX - state.viewport.x) * scaleRatio,
            y: centerY - (centerY - state.viewport.y) * scaleRatio,
            scale: newScale,
          },
        };
      }

      return {
        viewport: {
          ...state.viewport,
          scale: newScale,
        },
      };
    }),

  resetViewport: () => set({ viewport: initialState.viewport }),

  pan: (deltaX, deltaY) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    })),

  // ============ TOOL ACTIONS ============
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ============ GESTURE ACTIONS ============
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setActiveGesture: (gesture) => set({ activeGesture: gesture }),

  // ============ CONTEXT MENU ACTIONS ============
  showContextMenu: (x, y, targetId) =>
    set({
      contextMenuPosition: { x, y },
      contextMenuTargetId: targetId,
    }),

  hideContextMenu: () =>
    set({
      contextMenuPosition: null,
      contextMenuTargetId: null,
    }),

  // ============ PANEL ACTIONS ============
  togglePanel: () =>
    set((state) => ({
      isPanelCollapsed: !state.isPanelCollapsed,
    })),

  // ============ PIN POPOVER ACTIONS ============
  setPinPopover: (popover) => set({ pinPopover: popover }),

  // ============ PIN EDIT MODAL ACTIONS ============
  setPinEditModal: (modal) => set({ pinEditModal: modal }),

  // ============ TEXT EDITOR ACTIONS ============
  setTextEdit: (edit) => set({ textEdit: edit }),

  // ============ STATE MANAGEMENT ============
  reset: () => set(initialState),
}));

// Selectors
export const selectSelectedIds = (state: UIState) => state.selectedItemIds;
export const selectSelectedLayerId = (state: UIState) => state.selectedLayerId;
export const selectViewport = (state: UIState) => state.viewport;
export const selectActiveTool = (state: UIState) => state.activeTool;
export const selectIsDrawing = (state: UIState) => state.isDrawing;
export const selectIsPanning = (state: UIState) => state.isPanning;
export const selectContextMenu = (state: UIState) => ({
  position: state.contextMenuPosition,
  targetId: state.contextMenuTargetId,
});

// Derived selectors
export const selectHasSelection = (state: UIState) =>
  state.selectedItemIds.length > 0;
export const selectSelectionCount = (state: UIState) =>
  state.selectedItemIds.length;
export const selectIsItemSelected = (itemId: string) => (state: UIState) =>
  state.selectedItemIds.includes(itemId);
