/**
 * Notification Types
 * Defines the notification data model
 */

/**
 * Notification type enum
 */
export type NotificationType =
  | "workspace_invitation"
  | "invitation_accepted"
  | "invitation_rejected"
  | "invitation_revoked"
  | "role_changed"
  | "removed_from_workspace"
  | "workspace_deleted"
  | "ownership_transferred";

/**
 * Notification interface
 */
export interface Notification {
  $id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

/**
 * Additional notification data stored as JSON
 */
export interface NotificationData {
  workspaceId?: string;
  workspaceName?: string;
  role?: string;
  inviterName?: string;
  inviterUserId?: string;
  inviteeName?: string;
  inviteeEmail?: string;
  invitationId?: string;
  previousRole?: string;
  newRole?: string;
  newOwnerName?: string;
  [key: string]: unknown;
}

/**
 * Notification creation input
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}

/**
 * Notification display helpers
 */
export const notificationTypeLabels: Record<NotificationType, string> = {
  workspace_invitation: "Workspace Invitation",
  invitation_accepted: "Invitation Accepted",
  invitation_rejected: "Invitation Rejected",
  invitation_revoked: "Invitation Revoked",
  role_changed: "Role Changed",
  removed_from_workspace: "Removed from Workspace",
  workspace_deleted: "Workspace Deleted",
  ownership_transferred: "Ownership Transferred",
};

/**
 * Get icon name for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "workspace_invitation":
      return "mail";
    case "invitation_accepted":
      return "check-circle";
    case "invitation_rejected":
      return "x-circle";
    case "invitation_revoked":
      return "ban";
    case "role_changed":
      return "user-cog";
    case "removed_from_workspace":
      return "user-minus";
    case "workspace_deleted":
      return "trash";
    case "ownership_transferred":
      return "arrow-left-right";
    default:
      return "bell";
  }
}
