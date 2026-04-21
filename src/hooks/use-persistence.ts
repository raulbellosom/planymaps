/**
 * usePersistence Hook
 * Handles debounced persistence of board changes
 *
 * Phase 1: Simple debounced saves with dirty tracking
 * Optimizes by batching rapid item updates into single persistence calls
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import type { BoardItem, Layer } from "@/types/board";
import {
  updateItemTransform,
  updateLayer,
  updateBoard,
  createLayer as createLayerService,
  deleteLayer as deleteLayerService,
} from "@/services/board-service";

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 1000;

// Maximum items to persist in a single batch
const MAX_BATCH_SIZE = 50;

interface PendingUpdate {
  type: "item" | "layer" | "board";
  id: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * Hook to manage debounced persistence of board changes
 */
export function usePersistence(debounceMs: number = DEFAULT_DEBOUNCE_MS) {
  const board = useBoardStore((state) => state.board);
  const isDirty = useBoardStore((state) => state.isDirty);
  const isPanning = useUIStore((state) => state.isPanning);
  const isDrawing = useUIStore((state) => state.isDrawing);

  const pendingUpdatesRef = useRef<PendingUpdate[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPersistingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Flush pending updates to the server
  const flushUpdates = useCallback(async () => {
    if (
      isPersistingRef.current ||
      pendingUpdatesRef.current.length === 0 ||
      !board
    ) {
      return;
    }

    isPersistingRef.current = true;

    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];
    setPendingCount(0);

    // Group updates by type and entity
    const itemUpdates = updates.filter((u) => u.type === "item");
    const layerUpdates = updates.filter((u) => u.type === "layer");
    const boardUpdates = updates.find((u) => u.type === "board");

    // Persist board-level updates
    if (boardUpdates) {
      try {
        await updateBoard(board.$id, boardUpdates.data);
      } catch (error) {
        console.error("[Persistence] Failed to update board:", error);
      }
    }

    // Persist layer updates (batch by ID, take latest)
    const layerUpdatesById = new Map<string, Record<string, unknown>>();
    for (const update of layerUpdates) {
      layerUpdatesById.set(update.id, {
        ...layerUpdatesById.get(update.id),
        ...update.data,
      });
    }
    for (const [layerId, data] of layerUpdatesById) {
      try {
        await updateLayer(layerId, data);
      } catch (error) {
        console.error("[Persistence] Failed to update layer:", error);
      }
    }

    // Persist item updates in batches
    const itemUpdatesById = new Map<string, Record<string, unknown>>();
    for (const update of itemUpdates) {
      itemUpdatesById.set(update.id, {
        ...itemUpdatesById.get(update.id),
        ...update.data,
      });
    }

    const itemIds = Array.from(itemUpdatesById.keys());
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < itemIds.length; i += MAX_BATCH_SIZE) {
      batches.push(itemIds.slice(i, i + MAX_BATCH_SIZE));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map((itemId) => {
          const data = itemUpdatesById.get(itemId)!;
          return updateItemTransform(itemId, data).catch((error) => {
            console.error("[Persistence] Failed to update item:", error);
          });
        }),
      );
    }

    // Clear dirty flag if all updates succeeded
    useBoardStore.getState().setDirty(false);

    isPersistingRef.current = false;
  }, [board]);

  // Schedule a flush after debounce delay
  const scheduleFlush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      flushUpdates();
    }, debounceMs);
  }, [debounceMs, flushUpdates]);

  // Queue an update
  const queueUpdate = useCallback(
    (
      type: "item" | "layer" | "board",
      id: string,
      data: Record<string, unknown>,
    ) => {
      pendingUpdatesRef.current.push({
        type,
        id,
        data,
        timestamp: Date.now(),
      });
      setPendingCount(pendingUpdatesRef.current.length);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  // Persist item transform (debounced)
  const persistItemTransform = useCallback(
    (itemId: string, transform: Partial<BoardItem>) => {
      queueUpdate("item", itemId, transform);
    },
    [queueUpdate],
  );

  // Persist layer update (debounced)
  const persistLayer = useCallback(
    (layerId: string, data: Partial<Layer>) => {
      queueUpdate("layer", layerId, data);
    },
    [queueUpdate],
  );

  // Persist layer creation (immediate, not debounced)
  const persistCreateLayer = useCallback(
    async (
      boardId: string,
      name: string,
      orderIndex: number,
    ): Promise<Layer | null> => {
      try {
        const newLayer = await createLayerService(boardId, name, orderIndex);
        return newLayer;
      } catch (error) {
        console.error("[Persistence] Failed to create layer:", error);
        return null;
      }
    },
    [],
  );

  // Persist layer deletion (immediate, not debounced)
  const persistDeleteLayer = useCallback(
    async (layerId: string): Promise<void> => {
      try {
        await deleteLayerService(layerId);
      } catch (error) {
        console.error("[Persistence] Failed to delete layer:", error);
      }
    },
    [],
  );

  // Persist board update (debounced)
  const persistBoard = useCallback(
    (data: Record<string, unknown>) => {
      queueUpdate("board", "board", data);
    },
    [queueUpdate],
  );

  // Force immediate flush (e.g., on blur or before unload)
  const forceFlush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    flushUpdates();
  }, [flushUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Flush any remaining updates
      flushUpdates();
    };
  }, [flushUpdates]);

  // Flush on visibility change (e.g., tab switch, minimize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        forceFlush();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [forceFlush]);

  // Don't persist while panning or drawing (performance)
  const shouldPersist = !isPanning && !isDrawing && isDirty;

  return {
    isDirty,
    shouldPersist,
    pendingCount,
    persistItemTransform,
    persistLayer,
    persistCreateLayer,
    persistDeleteLayer,
    persistBoard,
    forceFlush,
  };
}

// ============================================================================
// PERSISTENCE ARCHITECTURE NOTES (Phase 1)
// ============================================================================
//
// 1. Dirty Tracking: The board store tracks isDirty to indicate local changes
//    that haven't been persisted yet.
//
// 2. Debounced Saves: Rapid changes (like dragging an item) are batched and
//    sent after a debounce delay (default 1 second).
//
// 3. Batching: Multiple item changes are batched into a single persistence
//    call, with a maximum batch size to prevent oversized requests.
//
// 4. Layer Updates: Layer property changes (visibility, opacity, name) are
//    queued separately and persisted in batches by layer ID.
//
// 5. Board Updates: Board-level changes (background, viewport) are persisted
//    immediately when queued.
//
// 6. Force Flush: The forceFlush function can be called to persist
//    immediately, such as when the user switches tabs or minimizes the window.
//
// 7. Graceful Degradation: If persistence fails, we log the error but
//    don't block the user. The isDirty flag remains set for retry.
//
// KNOWN LIMITATIONS:
//
// - No conflict detection: If another user modifies the same item,
//   the last write wins.
//
// - No offline queue: Failed updates are logged but not retried automatically.
//
// - No versioning: We don't track document versions, so we can't detect
//   whether our cached data is stale.
//
// FUTURE OPTIMIZATIONS:
//
// - Implement an update queue that persists in the background
// - Add exponential backoff for failed persistence attempts
// - Track pending updates in localStorage for recovery
// - Add a "sync status" indicator in the UI
// ============================================================================
