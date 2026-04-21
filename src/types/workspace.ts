/**
 * Workspace Types
 * Defines the data model for workspaces and membership
 */

// Role hierarchy: owner > admin > editor > viewer
export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface Workspace {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  ownerId: string;
  archivedAt?: string;
}

export interface WorkspaceMember {
  $id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

// Permission check results
export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canAdmin: boolean;
  isOwner: boolean;
}

/**
 * Check if a role has at least the specified permission level
 */
export function hasRoleLevel(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    owner: 3,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check workspace permissions based on role
 */
export function getWorkspacePermissions(role: WorkspaceRole): PermissionCheck {
  return {
    canView: hasRoleLevel(role, "viewer"),
    canEdit: hasRoleLevel(role, "editor"),
    canAdmin: hasRoleLevel(role, "admin"),
    isOwner: role === "owner",
  };
}

/**
 * Role display names
 */
export const roleDisplayNames: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

/**
 * Role descriptions
 */
export const roleDescriptions: Record<WorkspaceRole, string> = {
  owner: "Full control including deletion",
  admin: "Manage members and settings",
  editor: "Create and edit content",
  viewer: "View content only",
};
