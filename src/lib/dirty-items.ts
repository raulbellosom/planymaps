/**
 * Dirty-item tracking
 *
 * An item is "dirty" while it has locally-queued changes that haven't been
 * confirmed by the server yet. During this window, incoming realtime echoes
 * (Appwrite sending back our own just-persisted write) must be ignored,
 * otherwise they overwrite newer local state and cause visible snap-back.
 *
 * Entries auto-expire after EXPIRY_MS as a safety valve in case a flush
 * fails and the clear call is never reached.
 */

const EXPIRY_MS = 5_000;

const dirtyItems = new Map<string, number>(); // id → timestamp of last mark

/**
 * Mark an item as having pending local changes.
 * Call this whenever an item update is queued for persistence.
 */
export function markItemDirty(id: string): void {
  dirtyItems.set(id, Date.now());
}

/**
 * Clear the dirty flag after the item has been successfully persisted.
 * Call this after a successful updateItemTransform API call.
 */
export function clearItemDirty(id: string): void {
  dirtyItems.delete(id);
}

/**
 * Returns true if the item has pending local changes that have not yet been
 * confirmed by the server, or were marked dirty within the last EXPIRY_MS.
 */
export function isItemDirty(id: string): boolean {
  const ts = dirtyItems.get(id);
  if (ts === undefined) return false;
  if (Date.now() - ts > EXPIRY_MS) {
    dirtyItems.delete(id);
    return false;
  }
  return true;
}
