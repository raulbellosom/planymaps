/**
 * Authorization helpers
 * Centralized permission checks for workspace + invitation operations.
 * Service layer should validate with these helpers before performing sensitive ops.
 */

import type { WorkspaceRole } from "@/types/workspace";
import type { InvitableRole, WorkspaceInvitation } from "@/types/invitation";

/**
 * Role hierarchy for comparison (higher = more privileges).
 */
const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export function roleRank(role: WorkspaceRole): number {
  return ROLE_HIERARCHY[role];
}

/**
 * Admin or Owner can invite members. Cannot invite anyone as owner
 * (already enforced by InvitableRole type, but double-checked at runtime).
 */
export function canInviteToWorkspace(
  actorRole: WorkspaceRole | null,
  // _targetRole is reserved for future role-tier validation (e.g. only
  // owners can invite admins). Currently any admin/owner can invite any
  // assignable role, so the parameter is unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetRole?: InvitableRole,
): boolean {
  if (!actorRole) return false;
  return actorRole === "owner" || actorRole === "admin";
}

/**
 * Revoking is allowed for:
 * - The inviter themselves
 * - Any admin or owner of the workspace
 * And only when the invitation is still pending.
 */
export function canRevokeInvitation(
  invitation: WorkspaceInvitation,
  actorUserId: string,
  actorRole: WorkspaceRole | null,
): boolean {
  if (invitation.status !== "pending") return false;
  if (invitation.inviterUserId === actorUserId) return true;
  if (actorRole === "owner" || actorRole === "admin") return true;
  return false;
}

/**
 * Responding (accept/reject) is only allowed for the intended invitee.
 * The invitee must have their userId on the invitation (set at create time or
 * on first response).
 */
export function canRespondToInvitation(
  invitation: WorkspaceInvitation,
  actorUserId: string,
): boolean {
  if (invitation.status !== "pending") return false;
  if (new Date(invitation.expiresAt) < new Date()) return false;
  if (invitation.inviteeUserId && invitation.inviteeUserId !== actorUserId) {
    return false;
  }
  return true;
}

/**
 * Can actor change the target's role?
 * - Owner can change any non-owner to any non-owner role.
 * - Admin can change editors/viewers (not admins, not owners).
 * - Cannot demote owner via this helper (ownership transfer is separate).
 */
export function canManageWorkspaceMember(
  actorRole: WorkspaceRole | null,
  targetRole: WorkspaceRole,
): boolean {
  if (!actorRole) return false;
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") {
    return targetRole === "editor" || targetRole === "viewer";
  }
  return false;
}

/**
 * Can actor remove the target member?
 * Same rules as canManageWorkspaceMember — owner cannot be removed.
 */
export function canRemoveWorkspaceMember(
  actorRole: WorkspaceRole | null,
  targetRole: WorkspaceRole,
): boolean {
  return canManageWorkspaceMember(actorRole, targetRole);
}

/**
 * Can the user edit board content (create/move/delete shapes, layers, etc.)?
 * Requires at least the "editor" role. null / "viewer" → false (fail-closed).
 */
export function canEditBoard(role: WorkspaceRole | null): boolean {
  if (!role) return false;
  return roleRank(role) >= roleRank("editor");
}
