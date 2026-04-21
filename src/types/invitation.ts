/**
 * Invitation Types
 * Defines the workspace invitation data model
 */

import type { WorkspaceRole } from "./workspace";

/**
 * Invitation status enum
 */
export type InvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "revoked"
  | "expired";

/**
 * Roles that can be assigned via invitation
 * Note: Owner cannot be assigned via invitation - only transferred
 */
export type InvitableRole = Extract<
  WorkspaceRole,
  "admin" | "editor" | "viewer"
>;

/**
 * Workspace invitation interface
 */
export interface WorkspaceInvitation {
  $id: string;
  workspaceId: string;
  inviterUserId: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  role: InvitableRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

/**
 * Invitation creation input
 */
export interface CreateInvitationInput {
  workspaceId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: InvitableRole;
  expiresInDays?: number;
}

/**
 * Invitation with workspace details
 */
export interface WorkspaceInvitationWithDetails extends WorkspaceInvitation {
  workspaceName?: string;
  inviterName?: string;
}

/**
 * Check if an invitation is active (can be accepted)
 */
export function isInvitationActive(invitation: WorkspaceInvitation): boolean {
  if (invitation.status !== "pending") return false;
  if (new Date(invitation.expiresAt) < new Date()) return false;
  return true;
}

/**
 * Check if an invitation can be revoked
 */
export function canRevokeInvitation(invitation: WorkspaceInvitation): boolean {
  return invitation.status === "pending" && isInvitationActive(invitation);
}

/**
 * Default invitation expiration period in days
 */
export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;
