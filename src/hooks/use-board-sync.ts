/**
 * useBoardSync Hook
 * Bridges the Zustand board store to Appwrite persistence.
 *
 * Strategy:
 * - On mount: seed the "known set" from already-loaded store state (server data).
 * - Watch store with subscribe(): detect creates, deletes, and updates.
 * - Creates/deletes: fire immediately.
 * - Updates: debounced (1 s) and batched.
 * - Guards against realtime feedback loops via isApplyingRemoteUpdate check.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useBoardStore } from "@/stores/board-store";
import type { BoardItem, Layer } from "@/types/board";
import {
  createItem,
  deleteItem,
  createLayer as createLayerService,
  deleteLayer as deleteLayerService,
  updateItemTransform,
  updateLayer,
} from "@/services/board-service";
import { markItemDirty, clearItemDirty } from "@/lib/dirty-items";

const DEBOUNCE_MS = 1_000;
const MAX_BATCH = 50;

interface PendingUpdate {
  type: "item" | "layer";
  id: string;
  data: Record<string, unknown>;
}

// Shared flag set by realtime-service to prevent feedback loops
// We read it via a global so we don't have to import circular deps
declare global {
  // eslint-disable-next-line no-var
  var __realtimeApplying: boolean | undefined;
}

function isApplyingRemote(): boolean {
  return globalThis.__realtimeApplying === true;
}

export interface UseBoardSyncReturn {
  isSyncing: boolean;
  pendingCount: number;
  forceFlush: () => void;
}

export function useBoardSync(boardId: string | null): UseBoardSyncReturn {
  // Track which IDs are confirmed to exist in Appwrite
  const syncedLayerIds = useRef<Set<string>>(new Set());
  const syncedItemIds = useRef<Set<string>>(new Set());

  // Pending debounced update queue
  const pendingUpdates = useRef<PendingUpdate[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isFlushing = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // ─── Seed known IDs from currently loaded store state ──────────────────────
  useEffect(() => {
    if (!boardId) return;

    // Seed from whatever is already in the store (loaded from server)
    const state = useBoardStore.getState();
    const newLayerIds = new Set<string>();
    const newItemIds = new Set<string>();

    for (const layer of state.layers) {
      newLayerIds.add(layer.$id);
    }
    for (const items of Object.values(state.itemsByLayer)) {
      for (const item of items) {
        newItemIds.add(item.$id);
      }
    }

    syncedLayerIds.current = newLayerIds;
    syncedItemIds.current = newItemIds;
  }, [boardId]);

  // ─── Flush pending updates ─────────────────────────────────────────────────
  const flushUpdates = useCallback(async () => {
    if (isFlushing.current || pendingUpdates.current.length === 0) return;

    isFlushing.current = true;
    setIsSyncing(true);

    const updates = [...pendingUpdates.current];
    pendingUpdates.current = [];
    setPendingCount(0);

    // Deduplicate by id+type (keep latest)
    const itemMap = new Map<string, Record<string, unknown>>();
    const layerMap = new Map<string, Record<string, unknown>>();

    for (const u of updates) {
      if (u.type === "item") {
        itemMap.set(u.id, { ...itemMap.get(u.id), ...u.data });
      } else {
        layerMap.set(u.id, { ...layerMap.get(u.id), ...u.data });
      }
    }

    // Persist layer updates
    for (const [id, data] of layerMap) {
      try {
        await updateLayer(id, data as Parameters<typeof updateLayer>[1]);
      } catch (err) {
        console.error("[BoardSync] Failed to update layer:", id, err);
      }
    }

    // Persist item updates in batches
    const itemIds = Array.from(itemMap.keys());
    for (let i = 0; i < itemIds.length; i += MAX_BATCH) {
      const batch = itemIds.slice(i, i + MAX_BATCH);
      await Promise.all(
        batch.map((id) => {
          const data = itemMap.get(id)!;
          return updateItemTransform(
            id,
            data as Parameters<typeof updateItemTransform>[1],
          )
            .then(() => {
              // Only clear if there are no newer pending updates for this id
              if (
                !pendingUpdates.current.some(
                  (u) => u.type === "item" && u.id === id,
                )
              ) {
                clearItemDirty(id);
              }
            })
            .catch((err) => {
              console.error("[BoardSync] Failed to update item:", id, err);
              // Leave dirty so the realtime guard stays active; next flush will retry
            });
        }),
      );
    }

    isFlushing.current = false;
    setIsSyncing(false);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flushUpdates, DEBOUNCE_MS);
  }, [flushUpdates]);

  const queueUpdate = useCallback(
    (type: "item" | "layer", id: string, data: Record<string, unknown>) => {
      pendingUpdates.current.push({ type, id, data });
      setPendingCount(pendingUpdates.current.length);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const forceFlush = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    flushUpdates();
  }, [flushUpdates]);

  // ─── Build item payload for createItem ─────────────────────────────────────
  function buildCreateItemPayload(item: BoardItem, bId: string) {
    const style = (() => {
      try {
        return JSON.parse(item.styleJson || "{}");
      } catch {
        return {};
      }
    })();
    const content = (() => {
      try {
        return JSON.parse(item.contentJson || "{}");
      } catch {
        return {};
      }
    })();

    return createItem(
      bId,
      item.layerId,
      item.type,
      item.name,
      item.orderIndex,
      {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation,
        scaleX: item.scaleX,
        scaleY: item.scaleY,
      },
      style,
      content,
      item.createdBy,
      item.$id, // pre-generated ID so local $id === Appwrite $id
    );
  }

  // ─── Subscribe to store changes ─────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    const unsubscribe = useBoardStore.subscribe((state, prevState) => {
      // Skip if realtime is applying a remote update (prevent loops)
      if (isApplyingRemote()) return;

      const bId = boardId;

      // ── Layer creates & deletes ────────────────────────────────────────────
      const prevLayerIds = new Set(prevState.layers.map((l) => l.$id));
      const nextLayerIds = new Set(state.layers.map((l) => l.$id));

      // New layers
      for (const layer of state.layers) {
        if (!syncedLayerIds.current.has(layer.$id)) {
          syncedLayerIds.current.add(layer.$id);
          const order = layer.order;
          createLayerService(bId, layer.name, order, layer.$id).catch((err) => {
            console.error(
              "[BoardSync] Failed to create layer:",
              layer.$id,
              err,
            );
            syncedLayerIds.current.delete(layer.$id);
          });
        }
      }

      // Deleted layers
      for (const id of syncedLayerIds.current) {
        if (!nextLayerIds.has(id)) {
          syncedLayerIds.current.delete(id);
          deleteLayerService(id).catch((err) => {
            console.error("[BoardSync] Failed to delete layer:", id, err);
          });
        }
      }

      // Layer property changes (name, visibility, lock, opacity, order)
      for (const layer of state.layers) {
        if (!syncedLayerIds.current.has(layer.$id)) continue; // still being created
        const prev = prevState.layers.find((l) => l.$id === layer.$id);
        if (!prev) continue;
        if (
          prev.name !== layer.name ||
          prev.visible !== layer.visible ||
          prev.locked !== layer.locked ||
          prev.opacity !== layer.opacity ||
          prev.order !== layer.order
        ) {
          queueUpdate("layer", layer.$id, {
            name: layer.name,
            visible: layer.visible,
            locked: layer.locked,
            opacity: layer.opacity,
            order: layer.order,
          });
        }
      }

      // ── Item creates & deletes ─────────────────────────────────────────────
      // Collect all current items
      const allCurrentItems: BoardItem[] = [];
      for (const items of Object.values(state.itemsByLayer)) {
        allCurrentItems.push(...items);
      }
      const allPrevItems: BoardItem[] = [];
      for (const items of Object.values(prevState.itemsByLayer)) {
        allPrevItems.push(...items);
      }

      const prevItemMap = new Map(allPrevItems.map((i) => [i.$id, i]));

      // New items
      for (const item of allCurrentItems) {
        if (!syncedItemIds.current.has(item.$id)) {
          syncedItemIds.current.add(item.$id);
          buildCreateItemPayload(item, bId).catch((err) => {
            console.error("[BoardSync] Failed to create item:", item.$id, err);
            syncedItemIds.current.delete(item.$id);
          });
        }
      }

      // Deleted items
      const allCurrentItemIds = new Set(allCurrentItems.map((i) => i.$id));
      for (const id of syncedItemIds.current) {
        if (!allCurrentItemIds.has(id)) {
          syncedItemIds.current.delete(id);
          deleteItem(id).catch((err) => {
            console.error("[BoardSync] Failed to delete item:", id, err);
          });
        }
      }

      // Item updates
      for (const item of allCurrentItems) {
        if (!syncedItemIds.current.has(item.$id)) continue;
        const prev = prevItemMap.get(item.$id);
        if (!prev) continue;

        // Check if transform or displayable state changed
        const transformChanged =
          prev.x !== item.x ||
          prev.y !== item.y ||
          prev.width !== item.width ||
          prev.height !== item.height ||
          prev.rotation !== item.rotation ||
          prev.scaleX !== item.scaleX ||
          prev.scaleY !== item.scaleY;

        const stateChanged =
          prev.visible !== item.visible ||
          prev.locked !== item.locked ||
          prev.opacity !== item.opacity ||
          prev.layerId !== item.layerId ||
          prev.orderIndex !== item.orderIndex ||
          prev.styleJson !== item.styleJson ||
          prev.contentJson !== item.contentJson ||
          prev.geoJson !== item.geoJson;

        if (transformChanged || stateChanged) {
          markItemDirty(item.$id);
          queueUpdate("item", item.$id, {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            rotation: item.rotation,
            scaleX: item.scaleX,
            scaleY: item.scaleY,
            visible: item.visible,
            locked: item.locked,
            opacity: item.opacity,
            layerId: item.layerId,
            orderIndex: item.orderIndex,
            styleJson: item.styleJson,
            contentJson: item.contentJson,
            geoJson: item.geoJson,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [boardId, queueUpdate]);

  // Flush on tab hide / page unload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") forceFlush();
    };
    const handleBeforeUnload = () => forceFlush();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [forceFlush]);

  return { isSyncing, pendingCount, forceFlush };
}
