/**
 * Share Service
 * Authenticated CRUD for board share links.
 * All mutations set document-level permissions so only the creator
 * can read/update/delete their own share links (row security enforced).
 */

import { getDatabases } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId } from "@/env";
import { Query, ID, Permission, Role } from "appwrite";

export type ExpiryOption = "1d" | "7d" | "30d" | null;

export interface ShareLink {
  $id: string;
  token: string;
  boardId: string;
  workspaceId: string;
  createdBy: string;
  label?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  $createdAt: string;
}

export interface CreateShareLinkOptions {
  label?: string;
  expiresIn: ExpiryOption;
}

function computeExpiresAt(expiresIn: ExpiryOption): string | null {
  if (!expiresIn) return null;
  const days = expiresIn === "1d" ? 1 : expiresIn === "7d" ? 7 : 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Create a new share link for a board.
 * Only the authenticated user (userId) can later manage this link.
 */
export async function createShareLink(
  boardId: string,
  workspaceId: string,
  userId: string,
  options: CreateShareLinkOptions,
): Promise<ShareLink> {
  const token = crypto.randomUUID();
  const expiresAt = computeExpiresAt(options.expiresIn);

  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("share_links"),
    ID.unique(),
    {
      token,
      boardId,
      workspaceId,
      createdBy: userId,
      label: options.label ?? null,
      expiresAt,
      isActive: true,
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  );

  return response as unknown as ShareLink;
}

/**
 * Revoke a share link (sets isActive = false).
 * Appwrite row security ensures only the owner can call this.
 */
export async function revokeShareLink(linkId: string): Promise<void> {
  await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("share_links"),
    linkId,
    { isActive: false },
  );
}

/**
 * List all active share links created by a user for a specific board.
 */
export async function listBoardShareLinks(
  boardId: string,
): Promise<ShareLink[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("share_links"),
    [
      Query.equal("boardId", boardId),
      Query.equal("isActive", true),
      Query.orderDesc("$createdAt"),
    ],
  );

  return response.documents as unknown as ShareLink[];
}

/**
 * Build the public viewer URL for a share token.
 */
export function buildShareUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${base}/share/${token}`;
}
