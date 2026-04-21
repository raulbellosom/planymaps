/**
 * Workspace Service
 * Provides CRUD operations for workspaces and membership management
 */

import { getDatabases } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import { Query, Permission, Role } from "appwrite";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@/types/workspace";

/**
 * Create a new workspace
 */
export async function createWorkspace(
  name: string,
  slug: string,
  ownerId: string,
): Promise<Workspace> {
  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    "unique()",
    {
      name,
      slug,
      ownerId,
    },
    [
      // Owner has full control
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ],
  );
  return response as unknown as Workspace;
}

/**
 * Check if a slug is already taken by another workspace
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const result = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspaces"),
    [Query.equal("slug", slug), Query.limit(1)],
  );
  return result.total > 0;
}

/**
 * Get a workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const response = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceId,
  );
  return response as unknown as Workspace;
}

/**
 * Update workspace details
 */
export async function updateWorkspace(
  workspaceId: string,
  data: Partial<Pick<Workspace, "name" | "slug">>,
): Promise<Workspace> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceId,
    {
      ...data,
    },
  );
  return response as unknown as Workspace;
}

/**
 * Archive a workspace (soft delete)
 */
export async function archiveWorkspace(
  workspaceId: string,
): Promise<Workspace> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceId,
    {
      archivedAt: new Date().toISOString(),
    },
  );
  return response as unknown as Workspace;
}

/**
 * List workspaces for a user (via membership)
 */
export async function listUserWorkspaces(userId: string): Promise<Workspace[]> {
  // First get all memberships for this user
  const memberships = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    [Query.equal("userId", userId)],
  );

  if (memberships.documents.length === 0) {
    return [];
  }

  // Then get the workspace details for each membership
  const workspaceIds = memberships.documents.map(
    (m: Record<string, unknown>) => m.workspaceId as string,
  );

  // Query workspaces by IDs
  const workspaces = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceIds.map((id: string) => Query.equal("$id", id)),
  );

  return workspaces.documents as unknown as Workspace[];
}

/**
 * Add a member to a workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    "unique()",
    {
      workspaceId,
      userId,
      role,
    },
    [
      // Member can read their own membership record; can delete (leave workspace)
      Permission.read(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  );

  // Grant the new member read access on the workspace document itself so that
  // row-security queries (listUserWorkspaces) can return the workspace to them.
  await _addMemberPermissionToWorkspace(workspaceId, userId);

  return response as unknown as WorkspaceMember;
}

/**
 * Internal helper: fetch the workspace document, add a user's read permission,
 * and persist the updated permissions array.
 */
async function _addMemberPermissionToWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const workspace = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceId,
  );

  const current: string[] = (workspace.$permissions as string[]) ?? [];
  const newPerm = Permission.read(Role.user(userId));

  if (!current.includes(newPerm)) {
    await getDatabases().updateDocument(
      getDatabaseId(),
      getCollectionId("workspaces"),
      workspaceId,
      {},
      [...current, newPerm],
    );
  }
}

/**
 * Internal helper: remove a user's read permission from the workspace document
 * when they leave or are removed.
 */
async function _removeMemberPermissionFromWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const workspace = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("workspaces"),
    workspaceId,
  );

  const current: string[] = (workspace.$permissions as string[]) ?? [];
  const permToRemove = Permission.read(Role.user(userId));
  const updated = current.filter((p) => p !== permToRemove);

  if (updated.length !== current.length) {
    await getDatabases().updateDocument(
      getDatabaseId(),
      getCollectionId("workspaces"),
      workspaceId,
      {},
      updated,
    );
  }
}

/**
 * Get member role in a workspace
 */
export async function getMemberRole(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const members = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    [Query.equal("workspaceId", workspaceId), Query.equal("userId", userId)],
  );

  if (members.documents.length === 0) {
    return null;
  }

  return (members.documents[0] as unknown as WorkspaceMember).role;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceRole,
): Promise<WorkspaceMember> {
  // Find the membership document
  const members = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    [Query.equal("workspaceId", workspaceId), Query.equal("userId", userId)],
  );

  if (members.documents.length === 0) {
    throw new Error("Member not found");
  }

  const memberId = members.documents[0].$id;

  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    memberId,
    { role: newRole },
  );

  return response as unknown as WorkspaceMember;
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const members = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    [Query.equal("workspaceId", workspaceId), Query.equal("userId", userId)],
  );

  if (members.documents.length === 0) {
    return; // Already removed
  }

  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    members.documents[0].$id,
  );

  // Revoke the user's read access on the workspace document
  await _removeMemberPermissionFromWorkspace(workspaceId, userId);
}

/**
 * List all members of a workspace
 */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_members"),
    [Query.equal("workspaceId", workspaceId)],
  );
  return response.documents as unknown as WorkspaceMember[];
}

/**
 * Check if user has required role level
 */
export async function hasPermission(
  workspaceId: string,
  userId: string,
  requiredRole: WorkspaceRole,
): Promise<boolean> {
  const userRole = await getMemberRole(workspaceId, userId);
  if (!userRole) return false;

  const roleHierarchy: Record<WorkspaceRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    owner: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
