/**
 * GET /api/users/[id]
 *
 * Server-only endpoint that resolves an Appwrite user id to a registered
 * user profile. Used to display member names/emails in the workspace
 * members management UI.
 *
 * SECURITY: Requires a valid Appwrite JWT in the Authorization header.
 * Returns only minimum public fields (id, name, email).
 */

import { NextRequest, NextResponse } from "next/server";
import { Client, Users, Account } from "node-appwrite";
import { publicEnv, serverEnv } from "@/env";

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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await validateJwt(token);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  try {
    const users = new Users(getServerClient());
    const found = await users.get(id);
    if (!found) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json(
      {
        user: {
          $id: found.$id,
          name: found.name ?? null,
          email: found.email,
          prefs: found.prefs ?? {},
        },
      },
      { status: 200 },
    );
  } catch {
    // Most commonly: user not found
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
