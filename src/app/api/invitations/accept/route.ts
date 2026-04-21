/**
 * POST /api/invitations/accept
 *
 * Server-side handler for accepting a workspace invitation.
 * Must run server-side because accepting requires:
 *   1. Creating a workspace_members document scoped to the new member
 *   2. Updating the workspace document's permission array to add the new
 *      member's read access — the client SDK forbids setting permissions that
 *      include other users' IDs in the existing array, so the API key is needed.
 *
 * SECURITY:
 * - Requires a valid Appwrite JWT in the Authorization header.
 * - The JWT user's $id must match the invitation's inviteeUserId.
 * - Invitation must be in `pending` status and not expired.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Client,
  Account,
  Databases,
  Permission,
  Role,
  ID,
  Query,
} from "node-appwrite";
import { publicEnv, serverEnv, getDatabaseId, getCollectionId } from "@/env";

export const runtime = "nodejs";

// ── Shared server client (API key) ──────────────────────────────────────────

function buildServerClient(): Client {
  if (!publicEnv.appwriteEndpoint || !publicEnv.appwriteProjectId) {
    throw new Error("Missing Appwrite endpoint or project ID env vars");
  }
  if (!serverEnv.appwriteApiKey) {
    throw new Error("Missing APPWRITE_API_KEY");
  }
  return new Client()
    .setEndpoint(publicEnv.appwriteEndpoint)
    .setProject(publicEnv.appwriteProjectId)
    .setKey(serverEnv.appwriteApiKey);
}

// ── JWT validation ───────────────────────────────────────────────────────────

async function validateJwtGetUserId(jwt: string): Promise<string | null> {
  try {
    const client = new Client()
      .setEndpoint(publicEnv.appwriteEndpoint!)
      .setProject(publicEnv.appwriteProjectId!)
      .setJWT(jwt);
    const account = new Account(client);
    const user = await account.get();
    return user?.$id ?? null;
  } catch {
    return null;
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = await validateJwtGetUserId(token);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Body
  let invitationId: string | undefined;
  try {
    const body = (await req.json()) as { invitationId?: string };
    invitationId = body.invitationId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!invitationId) {
    return NextResponse.json(
      { error: "Missing required field: invitationId" },
      { status: 400 },
    );
  }

  const serverClient = buildServerClient();
  const db = new Databases(serverClient);

  // Fetch the invitation
  let invitation: Record<string, unknown>;
  try {
    invitation = await db.getDocument(
      getDatabaseId(),
      getCollectionId("workspace_invitations"),
      invitationId,
    );
  } catch {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }

  // Validate ownership & status
  const inviteeUserId = invitation.inviteeUserId as string | undefined;
  if (inviteeUserId && inviteeUserId !== userId) {
    return NextResponse.json(
      { error: "This invitation is not for your account" },
      { status: 403 },
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      {
        error:
          invitation.status === "accepted"
            ? "Invitation already accepted"
            : invitation.status === "rejected"
              ? "Invitation was already declined"
              : invitation.status === "revoked"
                ? "This invitation has been revoked"
                : "Invitation is no longer valid",
      },
      { status: 409 },
    );
  }

  if (new Date(invitation.expiresAt as string) < new Date()) {
    // Mark expired
    await db.updateDocument(
      getDatabaseId(),
      getCollectionId("workspace_invitations"),
      invitationId,
      { status: "expired" },
    );
    return NextResponse.json(
      { error: "Invitation has expired" },
      { status: 410 },
    );
  }

  const workspaceId = invitation.workspaceId as string;
  const role = invitation.role as string;
  const inviterUserId = invitation.inviterUserId as string;
  const inviteeEmail = invitation.inviteeEmail as string;

  try {
    // 1. Patch inviteeUserId if not set yet
    if (!inviteeUserId) {
      await db.updateDocument(
        getDatabaseId(),
        getCollectionId("workspace_invitations"),
        invitationId,
        { inviteeUserId: userId },
      );
    }

    // 2. Create workspace_members document (skip if already a member)
    const existing = await db.listDocuments(
      getDatabaseId(),
      getCollectionId("workspace_members"),
      [Query.equal("workspaceId", workspaceId), Query.equal("userId", userId)],
    );

    if (existing.total === 0) {
      await db.createDocument(
        getDatabaseId(),
        getCollectionId("workspace_members"),
        ID.unique(),
        {
          workspaceId,
          userId,
          role,
          createdAt: new Date().toISOString(),
        },
        [
          // Member can read and delete (leave) their own record
          Permission.read(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      );
    }

    // 3. Add the new member's read permission to the workspace document.
    //    The API key lets us read+write the existing permissions array even
    //    though it contains other users' IDs (client SDK would reject this).
    const workspace = await db.getDocument(
      getDatabaseId(),
      getCollectionId("workspaces"),
      workspaceId,
    );
    const currentPerms: string[] = (workspace.$permissions as string[]) ?? [];
    const newPerm = Permission.read(Role.user(userId));
    if (!currentPerms.includes(newPerm)) {
      await db.updateDocument(
        getDatabaseId(),
        getCollectionId("workspaces"),
        workspaceId,
        {},
        [...currentPerms, newPerm],
      );
    }

    // 4. Mark invitation as accepted
    await db.updateDocument(
      getDatabaseId(),
      getCollectionId("workspace_invitations"),
      invitationId,
      {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      },
    );

    // 5. Notify the inviter (best-effort — failure does not roll back)
    try {
      const workspaceName = workspace.name as string | undefined;
      await db.createDocument(
        getDatabaseId(),
        getCollectionId("notifications"),
        ID.unique(),
        {
          userId: inviterUserId,
          type: "invitation_accepted",
          title: "Invitation accepted",
          message: workspaceName
            ? `Your invitation to "${workspaceName}" was accepted.`
            : "Your workspace invitation was accepted.",
          data: JSON.stringify({
            invitationId,
            workspaceId,
            workspaceName,
            role,
            inviteeEmail,
          }),
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(inviterUserId)),
          Permission.update(Role.user(inviterUserId)),
          Permission.delete(Role.user(inviterUserId)),
        ],
      );
    } catch (notifErr) {
      console.error("[invitations/accept] Failed to notify inviter:", notifErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to accept invitation";
    console.error("[invitations/accept]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
