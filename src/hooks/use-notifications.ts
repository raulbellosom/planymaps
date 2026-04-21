"use client";

/**
 * useNotifications Hook
 * Manages user notifications with live Appwrite Realtime updates.
 *
 * Strategy:
 * - On mount: fetch the initial list + unread count from the server
 * - Subscribe to notifications collection; filter by current userId
 * - Merge create/update/delete events into local state
 * - Subscription is torn down automatically on unmount / user change
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "@/types/notification";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
} from "@/services/notification-service";
import {
  subscribeToUserNotifications,
  subscribeToUserInvitations,
} from "@/lib/realtime/realtime-service";
import { useAuth } from "@/hooks/use-auth";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const MAX_NOTIFICATIONS = 50;

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const userId = user?.$id ?? null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, { limit: MAX_NOTIFICATIONS }),
        getUnreadCount(userId),
      ]);

      if (!mountedRef.current) return;
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    // refresh() drives the initial fetch; the async body of refresh handles
    // its own loading/error state so cascading renders are bounded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserNotifications(userId, {
      onCreated: (notification) => {
        if (!mountedRef.current) return;
        setNotifications((prev) => {
          if (prev.some((n) => n.$id === notification.$id)) return prev;
          return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
        if (!notification.isRead) {
          setUnreadCount((c) => c + 1);
        }
      },
      onUpdated: (notification) => {
        if (!mountedRef.current) return;
        setNotifications((prev) => {
          const idx = prev.findIndex((n) => n.$id === notification.$id);
          if (idx === -1) return prev;
          const prevWasUnread = !prev[idx].isRead;
          const nextIsUnread = !notification.isRead;
          if (prevWasUnread && !nextIsUnread) {
            setUnreadCount((c) => Math.max(0, c - 1));
          } else if (!prevWasUnread && nextIsUnread) {
            setUnreadCount((c) => c + 1);
          }
          const next = prev.slice();
          next[idx] = notification;
          return next;
        });
      },
      onDeleted: (notificationId) => {
        if (!mountedRef.current) return;
        setNotifications((prev) => {
          const removed = prev.find((n) => n.$id === notificationId);
          if (removed && !removed.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.$id !== notificationId);
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Fallback realtime: workspace_invitations uses rowSecurity:false so its
  // realtime events are reliably delivered cross-origin. Whenever an invitation
  // is created or updated for this user we trigger a notifications refresh so
  // the bell updates even if the notifications collection realtime event was
  // missed (rowSecurity:true + cross-origin session auth timing issue).
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (mountedRef.current) void refresh();
      }, 400);
    };

    const unsubscribeInv = subscribeToUserInvitations(userId, {
      onCreated: scheduleRefresh,
      onUpdated: scheduleRefresh,
    });

    return () => {
      unsubscribeInv();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [userId, refresh]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      try {
        await markNotificationAsRead(notificationId, userId);
        // Optimistic: realtime event will also arrive, but update locally now.
        setNotifications((prev) =>
          prev.map((n) =>
            n.$id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark as read";
        setError(message);
      }
    },
    [userId],
  );

  const markAllAsReadFn = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.isRead
            ? n
            : { ...n, isRead: true, readAt: new Date().toISOString() },
        ),
      );
      setUnreadCount(0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to mark all as read";
      setError(message);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead: markAllAsReadFn,
  };
}
