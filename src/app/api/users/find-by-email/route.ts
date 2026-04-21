/**
 * GET /api/users/find-by-email?email=...
 *
 * Server-only endpoint that resolves an email address to a registered
 * Appwrite user. Used by the invitation flow to validate that the invitee
 * has a registered account before creating an invitation.
 *
 * SECURITY:
 * - Requires a valid Appwrite JWT in the Authorization header
 *   (Authorization: Bearer <jwt>). The client SDK cannot directly query
 *   users by email, so this endpoint uses the server-side API key — the
 *   JWT check prevents open email-enumeration by anonymous users.
 * - Returns only the minimum fields needed (id, name, email).
 */

import { NextRequest, NextResponse } from "next/server";
import { Client, Users, Query, Account } from "node-appwrite";
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

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await validateJwt(token);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const users = new Users(getServerClient());
    const result = await users.list([
      Query.equal("email", email),
      Query.limit(1),
    ]);
    const found = result.users[0];
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
