/**
 * Realtime Service
 * Handles Appwrite Realtime subscriptions for collaborative board editing
 *
 * Phase 1: Basic subscription-based refresh with optimistic updates
 * Known limitations documented at the bottom of this file
 */

import { getClient } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import type { Board, Layer, BoardItem } from "@/types/board";
import type { Notification, NotificationData } from "@/types/notification";
import type { WorkspaceInvitation } from "@/types/invitation";
import type { WorkspaceMember } from "@/types/workspace";
import { useBoardStore } from "@/stores/board-store";
import { isItemDirty } from "@/lib/dirty-items";

// Realtime event types from Appwrite
export type RealtimeEventType = "create" | "update" | "delete";

export interface RealtimeEvent<T> {
  type: RealtimeEventType;
  payload: T;
}

// Subscription cleanup functions
type UnsubscribeFn = () => void;

// Track active subscriptions
const activeSubscriptions: UnsubscribeFn[] = [];

// Flag to prevent cascading updates
let isApplyingRemoteUpdate = false;

/**
 * Mark that we're applying a remote update (to prevent feedback loops)
 */
function markApplyingRemoteUpdate() {
  isApplyingRemoteUpdate = true;
  globalThis.__realtimeApplying = true;
}

/**
 * Check if we're currently applying a remote update
 */
function isApplyingRemote(): boolean {
  return isApplyingRemoteUpdate;
}

/**
 * Reset the remote update flag
 */
function resetApplyingRemoteUpdate() {
  isApplyingRemoteUpdate = false;
  globalThis.__realtimeApplying = false;
}

/**
 * Build a realtime channel URL for a collection
 */
function getCollectionChannel(collectionId: string): string {
  return `databases.${getDatabaseId()}.collections.${collectionId}.documents`;
}

/**
 * Handle board realtime events
 */
function handleBoardEvent(event: RealtimeEvent<Board>) {
  if (isApplyingRemote()) return;

  const store = useBoardStore.getState();

  switch (event.type) {
    case "update":
      if (store.board && store.board.$id === event.payload.$id) {
        markApplyingRemoteUpdate();
        store.updateBoard(event.payload);
        resetApplyingRemoteUpdate();
      }
      break;
    case "delete":
      // Board deletion - would need to handle navigation
      console.log("[Realtime] Board deleted:", event.payload.$id);
      break;
    // Create events for boards are handled via full board reload
  }
}

/**
 * Handle layer realtime events
 */
function handleLayerEvent(event: RealtimeEvent<Layer>) {
  if (isApplyingRemote()) return;

  const store = useBoardStore.getState();

  switch (event.type) {
    case "create": {
      const alreadyExists = store.layers.some(
        (l) => l.$id === event.payload.$id,
      );
      markApplyingRemoteUpdate();
      if (alreadyExists) {
        // Own-client echo: update with any server-set fields (timestamps etc.)
        store.updateLayer(event.payload.$id, event.payload);
      } else {
        store.addLayer(event.payload);
      }
      resetApplyingRemoteUpdate();
      break;
    }
    case "update":
      markApplyingRemoteUpdate();
      store.updateLayer(event.payload.$id, event.payload);
      resetApplyingRemoteUpdate();
      break;
    case "delete":
      markApplyingRemoteUpdate();
      store.removeLayer(event.payload.$id);
      resetApplyingRemoteUpdate();
      break;
  }
}

/**
 * Handle item realtime events
 */
function handleItemEvent(event: RealtimeEvent<BoardItem>) {
  if (isApplyingRemote()) return;

  const store = useBoardStore.getState();

  switch (event.type) {
    case "create": {
      const alreadyExists = Object.values(store.itemsByLayer)
        .flat()
        .some((i) => i.$id === event.payload.$id);
      markApplyingRemoteUpdate();
      if (alreadyExists) {
        // Own-client echo: update with any server-set fields
        store.updateItem(event.payload.$id, event.payload);
      } else {
        store.addItem(event.payload.layerId, event.payload);
      }
      resetApplyingRemoteUpdate();
      break;
    }
    case "update":
      // Skip own-client echoes for items with pending local changes.
      // The local state is newer than what the server echoed back;
      // the pending debounced flush will send the correct final position.
      if (isItemDirty(event.payload.$id)) return;
      markApplyingRemoteUpdate();
      store.updateItem(event.payload.$id, event.payload);
      resetApplyingRemoteUpdate();
      break;
    case "delete":
      markApplyingRemoteUpdate();
      store.removeItem(event.payload.$id);
      resetApplyingRemoteUpdate();
      break;
  }
}

/**
 * Subscribe to board updates
 */
export function subscribeToBoard(
  boardId: string,
  callbacks?: {
    onBoardUpdate?: (board: Board) => void;
    onLayerEvent?: (event: RealtimeEvent<Layer>) => void;
    onItemEvent?: (event: RealtimeEvent<BoardItem>) => void;
  },
): UnsubscribeFn {
  const client = getClient();
  const unsubscribes: UnsubscribeFn[] = [];

  // Subscribe to boards collection (for this specific board)
  const boardChannel = `${getCollectionChannel(getCollectionId("boards"))}.${boardId}`;
  const boardSub = client.subscribe(boardChannel, (response) => {
    const eventType = response.events[0]?.includes(".create")
      ? "create"
      : response.events[0]?.includes(".delete")
        ? "delete"
        : "update";

    const payload = response.payload as unknown as Board;
    handleBoardEvent({ type: eventType, payload });

    if (eventType === "update" && callbacks?.onBoardUpdate) {
      callbacks.onBoardUpdate(payload);
    }
  });
  unsubscribes.push(boardSub);

  // Subscribe to layers collection filtered by boardId
  // Note: Appwrite realtime doesn't support filtering, so we subscribe to all
  // layers and filter client-side
  const layersChannel = getCollectionChannel(getCollectionId("board_layers"));
  const layersSub = client.subscribe(layersChannel, (response) => {
    const payload = response.payload as unknown as Layer;

    // Only process if this layer belongs to our board
    if (payload.boardId !== boardId) return;

    const eventType = response.events[0]?.includes(".create")
      ? "create"
      : response.events[0]?.includes(".delete")
        ? "delete"
        : "update";

    const event: RealtimeEvent<Layer> = { type: eventType, payload };
    handleLayerEvent(event);
    callbacks?.onLayerEvent?.(event);
  });
  unsubscribes.push(layersSub);

  // Subscribe to items collection filtered by boardId
  const itemsChannel = getCollectionChannel(getCollectionId("board_items"));
  const itemsSub = client.subscribe(itemsChannel, (response) => {
    const payload = response.payload as unknown as BoardItem;

    // Only process if this item belongs to our board
    if (payload.boardId !== boardId) return;

    const eventType = response.events[0]?.includes(".create")
      ? "create"
      : response.events[0]?.includes(".delete")
        ? "delete"
        : "update";

    const event: RealtimeEvent<BoardItem> = { type: eventType, payload };
    handleItemEvent(event);
    callbacks?.onItemEvent?.(event);
  });
  unsubscribes.push(itemsSub);

  // Combine unsubscribe functions
  const unsubscribe = () => {
    unsubscribes.forEach((fn) => fn());
  };

  activeSubscriptions.push(unsubscribe);
  return unsubscribe;
}

/**
 * Unsubscribe from all active realtime subscriptions
 */
export function unsubscribeAll(): void {
  activeSubscriptions.forEach((fn) => fn());
  activeSubscriptions.length = 0;
}

/**
 * Get the number of active subscriptions
 */
export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.length;
}

// ============================================================================
// USER-SCOPED SUBSCRIPTIONS (notifications + invitations)
// ============================================================================

interface UserNotificationHandlers {
  onCreated?: (notification: Notification) => void;
  onUpdated?: (notification: Notification) => void;
  onDeleted?: (notificationId: string) => void;
}

interface UserInvitationHandlers {
  onCreated?: (invitation: WorkspaceInvitation) => void;
  onUpdated?: (invitation: WorkspaceInvitation) => void;
}

function normalizeNotification(raw: unknown): Notification {
  const doc = raw as Record<string, unknown>;
  let data: NotificationData | undefined;
  const rawData = doc.data;
  if (typeof rawData === "string" && rawData) {
    try {
      data = JSON.parse(rawData) as NotificationData;
    } catch {
      data = undefined;
    }
  } else if (rawData && typeof rawData === "object") {
    data = rawData as NotificationData;
  }
  return { ...(doc as unknown as Notification), data };
}

function eventTypeFrom(events: string[] | undefined): RealtimeEventType {
  if (!events || events.length === 0) return "update";
  if (events[0].includes(".create")) return "create";
  if (events[0].includes(".delete")) return "delete";
  return "update";
}

/**
 * Subscribe to notifications for a specific user.
 *
 * Appwrite Realtime has no server-side filter, so we subscribe to the full
 * collection and filter client-side by userId. The notifications collection
 * is document-permissioned per user, so this subscription will only receive
 * events for documents the current session is allowed to read — but we
 * still check `userId` defensively.
 */
export function subscribeToUserNotifications(
  userId: string,
  handlers: UserNotificationHandlers = {},
): UnsubscribeFn {
  const client = getClient();
  const channel = getCollectionChannel(getCollectionId("notifications"));

  const unsubscribe = client.subscribe(channel, (response) => {
    const rawPayload = response.payload as Record<string, unknown> | undefined;
    if (!rawPayload) return;
    if (rawPayload.userId !== userId) return;

    const type = eventTypeFrom(response.events as string[] | undefined);
    const notification = normalizeNotification(rawPayload);

    switch (type) {
      case "create":
        handlers.onCreated?.(notification);
        break;
      case "update":
        handlers.onUpdated?.(notification);
        break;
      case "delete":
        handlers.onDeleted?.(notification.$id);
        break;
    }
  });

  activeSubscriptions.push(unsubscribe);
  return unsubscribe;
}

/**
 * Subscribe to workspace_invitations updates relevant to a specific user.
 * Filters client-side by `inviteeUserId`.
 */
export function subscribeToUserInvitations(
  userId: string,
  handlers: UserInvitationHandlers = {},
): UnsubscribeFn {
  const client = getClient();
  const channel = getCollectionChannel(
    getCollectionId("workspace_invitations"),
  );

  const unsubscribe = client.subscribe(channel, (response) => {
    const payload = response.payload as WorkspaceInvitation | undefined;
    if (!payload) return;
    if (payload.inviteeUserId !== userId) return;

    const type = eventTypeFrom(response.events as string[] | undefined);

    switch (type) {
      case "create":
        handlers.onCreated?.(payload);
        break;
      case "update":
        handlers.onUpdated?.(payload);
        break;
      case "delete":
        // Deletes not expected for invitations (they transition statuses instead)
        break;
    }
  });

  activeSubscriptions.push(unsubscribe);
  return unsubscribe;
}

/**
 * Subscribe to workspace_invitations updates for a workspace (all members),
 * used by the members management panel to refresh pending invitations in
 * real time. Filters client-side by `workspaceId`.
 */
export function subscribeToWorkspaceInvitations(
  workspaceId: string,
  handlers: UserInvitationHandlers = {},
): UnsubscribeFn {
  const client = getClient();
  const channel = getCollectionChannel(
    getCollectionId("workspace_invitations"),
  );

  const unsubscribe = client.subscribe(channel, (response) => {
    const payload = response.payload as WorkspaceInvitation | undefined;
    if (!payload) return;
    if (payload.workspaceId !== workspaceId) return;

    const type = eventTypeFrom(response.events as string[] | undefined);

    switch (type) {
      case "create":
        handlers.onCreated?.(payload);
        break;
      case "update":
        handlers.onUpdated?.(payload);
        break;
      case "delete":
        break;
    }
  });

  activeSubscriptions.push(unsubscribe);
  return unsubscribe;
}

/**
 * Subscribe to workspace_members events for a specific user.
 * Used by WorkspaceContext to refresh the workspace list when the user joins
 * a workspace (invitation accepted) or is removed from one.
 *
 * Note: Appwrite delivers delete events on channel even after permissions are
 * revoked for the session because the subscription was opened while the user
 * still had access. This is intentional and relied upon here.
 */
export function subscribeToUserMemberships(
  userId: string,
  handlers: {
    onCreated?: (membership: WorkspaceMember) => void;
    onDeleted?: (membership: WorkspaceMember) => void;
  } = {},
): UnsubscribeFn {
  const client = getClient();
  const channel = getCollectionChannel(getCollectionId("workspace_members"));

  const unsubscribe = client.subscribe(channel, (response) => {
    const payload = response.payload as WorkspaceMember | undefined;
    if (!payload) return;
    if (payload.userId !== userId) return;

    const type = eventTypeFrom(response.events as string[] | undefined);
    if (type === "create") handlers.onCreated?.(payload);
    if (type === "delete") handlers.onDeleted?.(payload);
  });

  activeSubscriptions.push(unsubscribe);
  return unsubscribe;
}

// ============================================================================
// KNOWN LIMITATIONS (Phase 1 Realtime)
// ============================================================================
// 1. No conflict resolution: If two users edit the same item simultaneously,
//    the last write wins. No CRDT or operational transform.
//
// 2. No cursor presence: We don't show other users' cursors or selections.
//    Users won't see who's editing what in real-time.
//
// 3. No partial updates: Remote updates replace the entire item state.
//    We don't support collaborative in-progress transforms.
//
// 4. No subscription filtering: Appwrite Realtime doesn't support server-side
//    filtering by attributes (like boardId). We subscribe to the entire
//    collection and filter client-side, which doesn't scale to many boards.
//
// 5. No reconnection handling: If the websocket connection drops, we don't
//    automatically reconnect or resync state.
//
// 6. Potential feedback loops: While we try to prevent local->remote->local
//    loops with the isApplyingRemote flag, there may be edge cases.
//
// 7. No version/versioning: We don't track document versions, so we can't
//    detect or resolve conflicts based on version numbers.
//
// 8. Optimistic updates are fire-and-forget: We apply local changes
//    immediately but don't track pending confirmations from the server.
//
// Future phases (TBD) could address these limitations with:
// - Phase 2: Cursor presence and selection sharing
// - Phase 2: Collaborative transform handling
// - Phase 2: Reconnection and resync logic
// - Phase 3: CRDT-based conflict resolution
// - Phase 3: Version vectors for conflict detection
// ============================================================================
