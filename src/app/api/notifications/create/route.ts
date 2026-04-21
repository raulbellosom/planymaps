/**
 * POST /api/notifications/create
 *
 * Server-only endpoint that creates a notification document with per-document
 * permissions scoped to the recipient. This must be server-side because:
 *   - rowSecurity is enabled on the `notifications` collection
 *   - A user session can only grant permissions to itself, not to other users
 *   - The server SDK (API key) can set arbitrary document permissions
 *
 * SECURITY:
 * - Requires a valid Appwrite JWT in the Authorization header so any
 *   authenticated user (e.g. the inviter) can trigger it, but anonymous
 *   callers cannot.
 * - Only the recipient (`userId`) receives read/update/delete permissions
 *   on the created document.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Client,
  Databases,
  Account,
  Permission,
  Role,
  ID,
} from "node-appwrite";
import { publicEnv, serverEnv, getDatabaseId, getCollectionId } from "@/env";

export const runtime = "nodejs";

function getServerClient() {
  if (!publicEnv.appwriteEndpoint || !publicEnv.appwriteProjectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }
  if (!serverEnv.appwriteApiKey) {
    throw new Error("Missing APPWRITE_API_KEY");
  }
  return new Client()
    .setEndpoint(publicEnv.appwriteEndpoint)
    .setProject(publicEnv.appwriteProjectId)
    .setKey(serverEnv.appwriteApiKey);
}

async function validateJwt(jwt: string): Promise<boolean> {
  try {
    const client = new Client()
      .setEndpoint(publicEnv.appwriteEndpoint!)
      .setProject(publicEnv.appwriteProjectId!)
      .setJWT(jwt);
    const account = new Account(client);
    const user = await account.get();
    return Boolean(user?.$id);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // JWT auth
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const valid = await validateJwt(token);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: {
    userId?: string;
    type?: string;
    title?: string;
    message?: string;
    data?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, type, title, message, data } = body;
  if (!userId || !type || !title || !message) {
    return NextResponse.json(
      { error: "Missing required fields: userId, type, title, message" },
      { status: 400 },
    );
  }

  try {
    const serverClient = getServerClient();
    const db = new Databases(serverClient);

    const doc = await db.createDocument(
      getDatabaseId(),
      getCollectionId("notifications"),
      ID.unique(),
      {
        userId,
        type,
        title,
        message,
        data: data !== undefined ? JSON.stringify(data) : null,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      [
        // Only the recipient can read, update, or delete their notification
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );

    return NextResponse.json({ notification: doc });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
