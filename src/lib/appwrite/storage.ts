"use client";

/**
 * Appwrite Storage Service
 * Provides typed wrappers for storage operations
 */

import { getStorage } from "./client";
import { publicEnv } from "@/env";

/**
 * Get the storage endpoint URL
 */
function getStorageEndpoint(): string {
  const endpoint = publicEnv.appwriteEndpoint;
  if (!endpoint) {
    throw new Error("Appwrite endpoint not configured");
  }
  // endpoint is already the full API base, e.g. "https://host/v1"
  // Append /storage to preserve the /v1 segment
  return `${endpoint}/storage`;
}

/**
 * Get avatars bucket ID
 */
export function getAvatarsBucketId(): string {
  return "avatars";
}

/**
 * Get board assets bucket ID
 */
export function getBoardAssetsBucketId(): string {
  return "board_assets";
}

/**
 * Get board thumbnails bucket ID
 */
export function getBoardThumbnailsBucketId(): string {
  return "board_thumbnails";
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  bucketId: string,
  fileId: string,
  file: File,
  permissions?: string[],
) {
  return await getStorage().createFile(bucketId, fileId, file, permissions);
}

/**
 * Get file preview URL
 */
export function getFilePreview(
  bucketId: string,
  fileId: string,
  width?: number,
  height?: number,
  quality?: number,
): string {
  const endpoint = getStorageEndpoint();
  let url = `${endpoint}/buckets/${bucketId}/files/${fileId}/preview?project=${publicEnv.appwriteProjectId}`;

  if (width) {
    url += `&width=${width}`;
  }
  if (height) {
    url += `&height=${height}`;
  }
  if (quality !== undefined) {
    url += `&quality=${quality}`;
  }

  return url;
}

/**
 * Get file download URL
 */
export function getFileDownload(bucketId: string, fileId: string): string {
  const endpoint = getStorageEndpoint();
  return `${endpoint}/buckets/${bucketId}/files/${fileId}/download?project=${publicEnv.appwriteProjectId}`;
}

/**
 * Get file view URL (for direct viewing)
 */
export function getFileView(bucketId: string, fileId: string): string {
  const endpoint = getStorageEndpoint();
  return `${endpoint}/buckets/${bucketId}/files/${fileId}/preview?project=${publicEnv.appwriteProjectId}`;
}

/**
 * Delete a file
 */
export async function deleteFile(bucketId: string, fileId: string) {
  return await getStorage().deleteFile(bucketId, fileId);
}

/**
 * List files in a bucket
 */
export async function listFiles(bucketId: string, queries?: string[]) {
  return await getStorage().listFiles(bucketId, queries);
}

/**
 * Get file info
 */
export async function getFile(bucketId: string, fileId: string) {
  return await getStorage().getFile(bucketId, fileId);
}

/**
 * Upload avatar image for a user
 * Crops the image to a square and uploads to the avatars bucket
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const bucketId = getAvatarsBucketId();
  const fileId = `${userId}-avatar`;

  // Delete existing avatar if it exists
  try {
    await getStorage().deleteFile(bucketId, fileId);
  } catch {
    // Ignore if file doesn't exist
  }

  // Upload the new avatar
  await getStorage().createFile(bucketId, fileId, file, [
    `read("any")`,
    `update("user:${userId}")`,
    `delete("user:${userId}")`,
  ]);

  return fileId;
}

/**
 * Get avatar view URL for a user
 */
export function getAvatarViewUrl(userId: string): string {
  const bucketId = getAvatarsBucketId();
  const fileId = `${userId}-avatar`;
  return getFileView(bucketId, fileId);
}

/**
 * Delete avatar for a user
 */
export async function deleteAvatar(userId: string): Promise<void> {
  const bucketId = getAvatarsBucketId();
  const fileId = `${userId}-avatar`;
  try {
    await getStorage().deleteFile(bucketId, fileId);
  } catch {
    // Ignore if file doesn't exist
  }
}
