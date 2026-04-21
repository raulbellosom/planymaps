/**
 * Users Service
 * Client-side helpers for looking up Appwrite user accounts.
 *
 * Email-based user lookup requires the Appwrite Server SDK (with API key),
 * so this service calls an authenticated Next.js API route rather than the
 * Appwrite client SDK directly. Authentication uses a short-lived Appwrite
 * JWT (created via account.createJWT) so the server can validate the caller
 * without depending on same-site session cookies.
 */

import { getAccount } from "@/lib/appwrite/client";

export interface PublicUserLookup {
  $id: string;
  name: string | null;
  email: string;
  prefs?: Record<string, unknown>;
}

/**
 * Find a registered user by email. Returns null if no user exists.
 */
export async function findUserByEmail(
  email: string,
): Promise<PublicUserLookup | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  let jwt: string;
  try {
    const result = await getAccount().createJWT();
    jwt = result.jwt;
  } catch {
    throw new Error("You must be logged in to look up users");
  }

  const response = await fetch(
    `/api/users/find-by-email?email=${encodeURIComponent(trimmed)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("You must be logged in to look up users");
    }
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "User lookup failed");
  }

  const data = (await response.json()) as { user: PublicUserLookup | null };
  return data.user;
}

/**
 * Find a registered user by id. Returns null if no user exists or the
 * lookup fails.
 */
export async function findUserById(
  userId: string,
): Promise<PublicUserLookup | null> {
  const trimmed = userId.trim();
  if (!trimmed) return null;

  let jwt: string;
  try {
    const result = await getAccount().createJWT();
    jwt = result.jwt;
  } catch {
    throw new Error("You must be logged in to look up users");
  }

  const response = await fetch(`/api/users/${encodeURIComponent(trimmed)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("You must be logged in to look up users");
    }
    return null;
  }

  const data = (await response.json()) as { user: PublicUserLookup | null };
  return data.user;
}
