/**
 * Notification Service
 * Handles notification operations
 */

import { getDatabases } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import { Query } from "appwrite";
import { getAccount } from "@/lib/appwrite/client";
import type {
  Notification,
  NotificationData,
  CreateNotificationInput,
} from "@/types/notification";

/**
 * Appwrite stores the `data` field as a serialized JSON string.
 * Normalize it back to an object so consumers always get `NotificationData`.
 */
function parseNotificationDoc(raw: unknown): Notification {
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

/**
 * Create a new notification.
 *
 * Uses the server-side API route so it can set per-document permissions for
 * the recipient without requiring the caller to be that user. The caller's
 * JWT is forwarded for authentication.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<Notification> {
  const { userId, type, title, message, data } = input;

  // Get a short-lived JWT for the currently logged-in user so the server
  // route can verify the request is from an authenticated session.
  const jwt = await getAccount().createJWT();

  const res = await fetch("/api/notifications/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt.jwt}`,
    },
    body: JSON.stringify({ userId, type, title, message, data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ??
        `Failed to create notification (${res.status})`,
    );
  }

  const { notification } = (await res.json()) as { notification: Notification };
  return notification;
}

/**
 * Get notification by ID
 */
export async function getNotification(
  notificationId: string,
): Promise<Notification | null> {
  try {
    const response = await getDatabases().getDocument(
      getDatabaseId(),
      getCollectionId("notifications"),
      notificationId,
    );
    return parseNotificationDoc(response);
  } catch {
    return null;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Notification[]> {
  const queries = [Query.equal("userId", userId)];

  if (options?.unreadOnly) {
    queries.push(Query.equal("isRead", false));
  }

  queries.push(Query.orderDesc("createdAt"));

  if (options?.limit) {
    queries.push(Query.limit(options.limit));
  }

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("notifications"),
    queries,
  );

  return response.documents.map(parseNotificationDoc);
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("notifications"),
    [Query.equal("userId", userId), Query.equal("isRead", false)],
  );

  return response.documents.length;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<Notification> {
  const notification = await getNotification(notificationId);

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("notifications"),
    notificationId,
    {
      isRead: true,
      readAt: new Date().toISOString(),
    },
  );

  return parseNotificationDoc(response);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const notifications = await getUserNotifications(userId, {
    unreadOnly: true,
  });

  await Promise.all(
    notifications.map((n) =>
      getDatabases().updateDocument(
        getDatabaseId(),
        getCollectionId("notifications"),
        n.$id,
        {
          isRead: true,
          readAt: new Date().toISOString(),
        },
      ),
    ),
  );
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<void> {
  const notification = await getNotification(notificationId);

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("notifications"),
    notificationId,
  );
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(
  userId: string,
  daysOld: number = 30,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const notifications = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("notifications"),
    [
      Query.equal("userId", userId),
      Query.equal("isRead", true),
      Query.lessThan("createdAt", cutoffDate.toISOString()),
    ],
  );

  let deletedCount = 0;
  for (const doc of notifications.documents) {
    try {
      await getDatabases().deleteDocument(
        getDatabaseId(),
        getCollectionId("notifications"),
        doc.$id,
      );
      deletedCount++;
    } catch {
      // Ignore errors
    }
  }

  return deletedCount;
}
