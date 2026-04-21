/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for layer and editor operations
 */

import { useEffect, useCallback } from "react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { useHistoryStore } from "@/stores/history-store";
import { TOOL_SHORTCUTS } from "@/config/keyboard-shortcuts";
import {
  layerUp,
  layerDown,
  layerToTop,
  layerToBottom,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  bringForwardMulti,
  sendBackwardMulti,
  bringToFrontMulti,
  sendToBackMulti,
} from "@/lib/ordering-commands";
import type { ToolType } from "@/stores/ui-store";

interface UseKeyboardShortcutsOptions {
  onCreateLayer?: () => void;
  onDeleteLayer?: () => void;
  onToggleLayerVisibility?: () => void;
  onToggleLayerLock?: () => void;
  onResetLayerPanelPosition?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {},
) {
  const {
    onCreateLayer,
    onDeleteLayer,
    onToggleLayerVisibility,
    onToggleLayerLock,
    onResetLayerPanelPosition,
    enabled = true,
  } = options;

  const layers = useBoardStore((state) => state.layers);
  const reorderLayers = useBoardStore((state) => state.reorderLayers);
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const removeItem = useBoardStore((state) => state.removeItem);
  const duplicateItem = useBoardStore((state) => state.duplicateItem);
  const reorderItems = useBoardStore((state) => state.reorderItems);
  const groupItemsAction = useBoardStore((state) => state.groupItems);
  const ungroupItemsAction = useBoardStore((state) => state.ungroupItems);

  const selectedLayerId = useUIStore((state) => state.selectedLayerId);
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const clearSelection = useUIStore((state) => state.clearSelection);
  const selectItems = useUIStore((state) => state.selectItems);
  const setActiveTool = useUIStore((state) => state.setActiveTool);

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  const handleUndo = useCallback(() => {
    const entry = undo();
    if (entry) {
      // Apply undo - restore previous state
      if (entry.previousLayers !== undefined) {
        useBoardStore.setState({ layers: entry.previousLayers });
      }
      if (entry.previousItemsByLayer !== undefined) {
        useBoardStore.setState({ itemsByLayer: entry.previousItemsByLayer });
      }
      if (entry.previousLayerState !== undefined && entry.layerId) {
        useBoardStore.setState((state) => ({
          layers: state.layers.map((l) =>
            l.$id === entry.layerId ? { ...l, ...entry.previousLayerState } : l,
          ),
        }));
      }
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const entry = redo();
    if (entry) {
      // Apply redo - restore new state
      if (entry.newLayers !== undefined) {
        useBoardStore.setState({ layers: entry.newLayers });
      }
      if (entry.newItemsByLayer !== undefined) {
        useBoardStore.setState({ itemsByLayer: entry.newItemsByLayer });
      }
      if (entry.newLayerState !== undefined && entry.layerId) {
        useBoardStore.setState((state) => ({
          layers: state.layers.map((l) =>
            l.$id === entry.layerId ? { ...l, ...entry.newLayerState } : l,
          ),
        }));
      }
    }
  }, [redo]);

  const handleLayerReorder = useCallback(
    (direction: "up" | "down" | "top" | "bottom") => {
      if (!selectedLayerId || layers.length <= 1) return;

      const currentLayers = [...layers].sort((a, b) => a.order - b.order);
      let newLayers: typeof layers;

      switch (direction) {
        case "up":
          newLayers = layerUp(currentLayers, selectedLayerId);
          break;
        case "down":
          newLayers = layerDown(currentLayers, selectedLayerId);
          break;
        case "top":
          newLayers = layerToTop(currentLayers, selectedLayerId);
          break;
        case "bottom":
          newLayers = layerToBottom(currentLayers, selectedLayerId);
          break;
      }

      // Update order indices
      const layerIds = newLayers.map((l) => l.$id);
      reorderLayers(layerIds);
    },
    [selectedLayerId, layers, reorderLayers],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Tool shortcuts (single keys - V, R, O, L, A, T, I, P, H)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const pressedKey = e.key.toLowerCase();
        for (const [toolId, shortcutKey] of Object.entries(TOOL_SHORTCUTS)) {
          if (shortcutKey.toLowerCase() === pressedKey) {
            e.preventDefault();
            setActiveTool(toolId as ToolType);
            return;
          }
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Alt + N: Create new layer
      if (ctrlKey && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onCreateLayer?.();
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (canUndo()) {
          handleUndo();
        }
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y: Redo
      if (
        (ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") ||
        (ctrlKey && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        if (canRedo()) {
          handleRedo();
        }
        return;
      }

      // Ctrl + L: Toggle layer lock
      if (
        ctrlKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "l" &&
        selectedLayerId
      ) {
        e.preventDefault();
        onToggleLayerLock?.();
        return;
      }

      // Ctrl + Shift + L: Toggle layer visibility
      if (
        ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "l" &&
        selectedLayerId
      ) {
        e.preventDefault();
        onToggleLayerVisibility?.();
        return;
      }

      // Ctrl + [: Send layer backward
      if (ctrlKey && e.key === "[") {
        e.preventDefault();
        if (!e.shiftKey) {
          handleLayerReorder("down");
        } else {
          handleLayerReorder("bottom");
        }
        return;
      }

      // Ctrl + ]: Bring layer forward
      if (ctrlKey && e.key === "]") {
        e.preventDefault();
        if (!e.shiftKey) {
          handleLayerReorder("up");
        } else {
          handleLayerReorder("top");
        }
        return;
      }

      // Delete/Backspace: Delete selected items (takes priority over layer delete)
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !ctrlKey &&
        !e.metaKey &&
        selectedItemIds.length > 0
      ) {
        e.preventDefault();
        selectedItemIds.forEach((id) => removeItem(id));
        clearSelection();
        return;
      }

      // Ctrl+D: Duplicate selected items
      if (
        ctrlKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "d" &&
        selectedItemIds.length > 0
      ) {
        e.preventDefault();
        selectedItemIds.forEach((id) => duplicateItem(id));
        return;
      }

      // Ctrl+A: Select all items in the active layer
      if (ctrlKey && !e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const layerId = selectedLayerId;
        if (layerId && itemsByLayer[layerId]) {
          selectItems(itemsByLayer[layerId].map((i) => i.$id));
        }
        return;
      }

      // Escape: Clear selection (also reset panel if it's been dragged off-screen)
      if (e.key === "Escape") {
        clearSelection();
        return;
      }

      // Ctrl+Shift+L: Reset layer panel position
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        onResetLayerPanelPosition?.();
        return;
      }

      // Ctrl+]/[: Item ordering when items are selected
      if (ctrlKey && selectedItemIds.length > 0) {
        // Group selected items by layer
        const byLayer: Record<string, string[]> = {};
        for (const id of selectedItemIds) {
          for (const [layerId, items] of Object.entries(itemsByLayer)) {
            if (items.some((i) => i.$id === id)) {
              if (!byLayer[layerId]) byLayer[layerId] = [];
              byLayer[layerId].push(id);
              break;
            }
          }
        }

        if (e.key === "]") {
          e.preventDefault();
          for (const [layerId, ids] of Object.entries(byLayer)) {
            const items = itemsByLayer[layerId] || [];
            const newItems =
              ids.length === 1
                ? e.shiftKey
                  ? bringToFront(items, ids[0])
                  : bringForward(items, ids[0])
                : e.shiftKey
                  ? bringToFrontMulti(items, ids)
                  : bringForwardMulti(items, ids);
            reorderItems(
              layerId,
              newItems.map((i) => i.$id),
            );
          }
          return;
        }

        if (e.key === "[") {
          e.preventDefault();
          for (const [layerId, ids] of Object.entries(byLayer)) {
            const items = itemsByLayer[layerId] || [];
            const newItems =
              ids.length === 1
                ? e.shiftKey
                  ? sendToBack(items, ids[0])
                  : sendBackward(items, ids[0])
                : e.shiftKey
                  ? sendToBackMulti(items, ids)
                  : sendBackwardMulti(items, ids);
            reorderItems(
              layerId,
              newItems.map((i) => i.$id),
            );
          }
          return;
        }
      }

      // Ctrl+G: Group selected items
      if (
        ctrlKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "g" &&
        selectedItemIds.length >= 2
      ) {
        e.preventDefault();
        groupItemsAction(selectedItemIds);
        return;
      }

      // Ctrl+Shift+G: Ungroup selected items
      if (
        ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "g" &&
        selectedItemIds.length > 0
      ) {
        e.preventDefault();
        const allItems = Object.values(itemsByLayer).flat();
        const groupIds = new Set<string>();
        for (const id of selectedItemIds) {
          const item = allItems.find((i) => i.$id === id);
          if (item?.parentGroupId) groupIds.add(item.parentGroupId);
        }
        for (const groupId of groupIds) {
          ungroupItemsAction(groupId);
        }
        clearSelection();
        return;
      }

      // Delete/Backspace: Delete layer (without ctrl/cmd to avoid conflicts with text deletion)
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !ctrlKey &&
        !e.metaKey &&
        selectedLayerId
      ) {
        // Only trigger if no items are selected (to avoid conflict with item deletion)
        if (selectedItemIds.length === 0) {
          e.preventDefault();
          onDeleteLayer?.();
        }
        return;
      }
    },
    [
      enabled,
      onCreateLayer,
      onToggleLayerLock,
      onToggleLayerVisibility,
      onDeleteLayer,
      onResetLayerPanelPosition,
      handleUndo,
      handleRedo,
      handleLayerReorder,
      canUndo,
      canRedo,
      selectedLayerId,
      selectedItemIds,
      itemsByLayer,
      removeItem,
      duplicateItem,
      reorderItems,
      clearSelection,
      selectItems,
      setActiveTool,
      groupItemsAction,
      ungroupItemsAction,
    ],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    handleUndo,
    handleRedo,
    handleLayerReorder,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
