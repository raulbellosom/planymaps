/**
 * Invitation Service
 * Handles workspace invitation lifecycle (create, accept, reject, revoke)
 * and emits notifications for every state change.
 */

import { getDatabases, getAccount } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import { Query, ID } from "appwrite";
import type {
  WorkspaceInvitation,
  InvitationStatus,
  CreateInvitationInput,
} from "@/types/invitation";
import { DEFAULT_INVITATION_EXPIRY_DAYS } from "@/types/invitation";
import { findUserByEmail, findUserById } from "@/services/users-service";
import { getMemberRole, getWorkspace } from "@/services/workspace-service";
import { createNotification } from "@/services/notification-service";
import {
  canInviteToWorkspace,
  canRespondToInvitation,
  canRevokeInvitation as canRevokeInvitationAuth,
} from "@/lib/authorization";

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<WorkspaceInvitation> {
  const { workspaceId, inviterUserId, role } = input;
  const inviteeEmail = input.inviteeEmail.trim().toLowerCase();
  const expiresInDays = input.expiresInDays ?? DEFAULT_INVITATION_EXPIRY_DAYS;

  const inviterRole = await getMemberRole(workspaceId, inviterUserId);
  if (!canInviteToWorkspace(inviterRole, role)) {
    throw new Error(
      "You do not have permission to invite members to this workspace",
    );
  }

  const inviteeUser = await findUserByEmail(inviteeEmail);
  if (!inviteeUser) {
    throw new Error(
      "No registered user found with this email. Ask them to sign up first.",
    );
  }

  if (inviteeUser.$id === inviterUserId) {
    throw new Error("You cannot invite yourself");
  }

  const existingRole = await getMemberRole(workspaceId, inviteeUser.$id);
  if (existingRole) {
    throw new Error("This user is already a member of the workspace");
  }

  const alreadyActive = await hasActiveInvitation(workspaceId, inviteeEmail);
  if (alreadyActive) {
    throw new Error("An active invitation already exists for this email");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    ID.unique(),
    {
      workspaceId,
      inviterUserId,
      inviteeEmail,
      inviteeUserId: inviteeUser.$id,
      role,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    },
  );

  const invitation = response as unknown as WorkspaceInvitation;

  try {
    const [workspace, inviterUser] = await Promise.all([
      getWorkspace(workspaceId).catch(() => null),
      findUserById(inviterUserId).catch(() => null),
    ]);
    await createNotification({
      userId: inviteeUser.$id,
      type: "workspace_invitation",
      title: "New workspace invitation",
      message: workspace
        ? `You've been invited to join "${workspace.name}" as ${role}.`
        : `You've been invited to join a workspace as ${role}.`,
      data: {
        invitationId: invitation.$id,
        workspaceId,
        workspaceName: workspace?.name,
        role,
        inviterUserId,
        inviterName: inviterUser?.name ?? undefined,
      },
    });
  } catch (err) {
    console.error("[invitation] Failed to emit notification:", err);
  }

  return invitation;
}

export async function getInvitation(
  invitationId: string,
): Promise<WorkspaceInvitation | null> {
  try {
    const response = await getDatabases().getDocument(
      getDatabaseId(),
      getCollectionId("workspace_invitations"),
      invitationId,
    );
    return response as unknown as WorkspaceInvitation;
  } catch {
    return null;
  }
}

export async function getPendingInvitationsForEmail(
  email: string,
): Promise<WorkspaceInvitation[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    [
      Query.equal("inviteeEmail", email.trim().toLowerCase()),
      Query.equal("status", "pending"),
    ],
  );

  const now = new Date();
  const invitations: WorkspaceInvitation[] = [];

  for (const doc of response.documents) {
    const invitation = doc as unknown as WorkspaceInvitation;
    if (new Date(invitation.expiresAt) > now) {
      invitations.push(invitation);
    } else {
      await updateInvitationStatus(invitation.$id, "expired");
    }
  }

  return invitations;
}

export async function getPendingInvitationsForUser(
  userId: string,
): Promise<WorkspaceInvitation[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    [Query.equal("inviteeUserId", userId), Query.equal("status", "pending")],
  );

  const now = new Date();
  const invitations: WorkspaceInvitation[] = [];

  for (const doc of response.documents) {
    const invitation = doc as unknown as WorkspaceInvitation;
    if (new Date(invitation.expiresAt) > now) {
      invitations.push(invitation);
    } else {
      await updateInvitationStatus(invitation.$id, "expired");
    }
  }

  return invitations;
}

export async function getWorkspaceInvitations(
  workspaceId: string,
  status?: InvitationStatus,
): Promise<WorkspaceInvitation[]> {
  const queries = [Query.equal("workspaceId", workspaceId)];
  if (status) {
    queries.push(Query.equal("status", status));
  }

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    queries,
  );

  return response.documents as unknown as WorkspaceInvitation[];
}

export async function hasActiveInvitation(
  workspaceId: string,
  inviteeEmail: string,
): Promise<boolean> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    [
      Query.equal("workspaceId", workspaceId),
      Query.equal("inviteeEmail", inviteeEmail.trim().toLowerCase()),
      Query.equal("status", "pending"),
    ],
  );

  if (response.documents.length === 0) return false;

  const now = new Date();
  for (const doc of response.documents) {
    const invitation = doc as unknown as WorkspaceInvitation;
    if (new Date(invitation.expiresAt) > now) {
      return true;
    }
  }

  return false;
}

export async function updateInvitationStatus(
  invitationId: string,
  status: InvitationStatus,
): Promise<WorkspaceInvitation> {
  const updateData: Record<string, unknown> = { status };

  switch (status) {
    case "accepted":
      updateData.acceptedAt = new Date().toISOString();
      break;
    case "rejected":
      updateData.rejectedAt = new Date().toISOString();
      break;
    case "revoked":
      updateData.revokedAt = new Date().toISOString();
      break;
    case "expired":
      break;
  }

  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("workspace_invitations"),
    invitationId,
    updateData,
  );

  return response as unknown as WorkspaceInvitation;
}

export async function acceptInvitation(
  invitationId: string,
): Promise<WorkspaceInvitation> {
  // Accepting must go through the server API route because it needs to update
  // the workspace document's permissions array via the API key. The client SDK
  // rejects updateDocument calls whose permissions array contains other users'
  // IDs (e.g. the workspace owner's ID that was set at workspace creation).
  const jwt = await getAccount().createJWT();

  const res = await fetch("/api/invitations/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt.jwt}`,
    },
    body: JSON.stringify({ invitationId }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      body.error ?? `Failed to accept invitation (${res.status})`,
    );
  }

  // Re-fetch the updated invitation so callers get the accepted record
  const updated = await getInvitation(invitationId);
  if (!updated) {
    throw new Error("Invitation not found after accepting");
  }
  return updated;
}

export async function rejectInvitation(
  invitationId: string,
  userId: string,
): Promise<WorkspaceInvitation> {
  const invitation = await getInvitation(invitationId);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (!canRespondToInvitation(invitation, userId)) {
    throw new Error("You cannot respond to this invitation");
  }

  const updated = await updateInvitationStatus(invitationId, "rejected");

  try {
    const workspace = await getWorkspace(invitation.workspaceId).catch(
      () => null,
    );
    await createNotification({
      userId: invitation.inviterUserId,
      type: "invitation_rejected",
      title: "Invitation declined",
      message: workspace
        ? `Your invitation to "${workspace.name}" was declined.`
        : "Your workspace invitation was declined.",
      data: {
        invitationId,
        workspaceId: invitation.workspaceId,
        workspaceName: workspace?.name,
        inviteeEmail: invitation.inviteeEmail,
      },
    });
  } catch (err) {
    console.error("[invitation] Failed to emit rejection notification:", err);
  }

  return updated;
}

export async function revokeInvitation(
  invitationId: string,
  actorUserId?: string,
): Promise<WorkspaceInvitation> {
  const invitation = await getInvitation(invitationId);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (actorUserId) {
    const actorRole = await getMemberRole(invitation.workspaceId, actorUserId);
    if (!canRevokeInvitationAuth(invitation, actorUserId, actorRole)) {
      throw new Error("You do not have permission to revoke this invitation");
    }
  } else if (invitation.status !== "pending") {
    throw new Error(
      `Invitation is not pending (current status: ${invitation.status})`,
    );
  }

  const updated = await updateInvitationStatus(invitationId, "revoked");

  if (invitation.inviteeUserId) {
    try {
      const workspace = await getWorkspace(invitation.workspaceId).catch(
        () => null,
      );
      await createNotification({
        userId: invitation.inviteeUserId,
        type: "invitation_revoked",
        title: "Invitation revoked",
        message: workspace
          ? `Your invitation to "${workspace.name}" was revoked.`
          : "A workspace invitation was revoked.",
        data: {
          invitationId,
          workspaceId: invitation.workspaceId,
          workspaceName: workspace?.name,
        },
      });
    } catch (err) {
      console.error(
        "[invitation] Failed to emit revocation notification:",
        err,
      );
    }
  }

  return updated;
}
