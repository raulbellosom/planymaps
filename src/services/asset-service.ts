/**
 * Asset Service
 * Provides operations for asset upload and management
 */

import { getDatabases, getStorage } from "@/lib/appwrite/client";
import { getDatabaseId, getCollectionId, getBucketId } from "@/env";
import { Query, Permission, Role } from "appwrite";
import {
  uploadFile as appwriteUploadFile,
  getFilePreview,
} from "@/lib/appwrite/storage";
import type { Asset, CreateAssetInput } from "@/types/asset";
import { isAllowedImageType, isValidFileSize } from "@/types/asset";

/**
 * Upload a file and create asset metadata
 */
export async function uploadAsset(
  file: File,
  workspaceId: string,
  uploadedBy: string,
  boardId?: string,
): Promise<Asset> {
  // Validate file
  if (!isAllowedImageType(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
  if (!isValidFileSize(file.size)) {
    throw new Error(`File size exceeds maximum allowed size`);
  }

  // Get image dimensions
  const dimensions = await getImageDimensions(file);

  // Generate file ID
  const fileId = generateFileId();

  // Storage files must be publicly readable (read("any")) because Konva loads
  // images with crossOrigin="anonymous" to prevent canvas taint. Anonymous CORS
  // requests send no credentials, so read("users") returns 404 + no CORS header.
  // Write/delete remain restricted to the uploader.
  await appwriteUploadFile(getBucketId("board_assets"), fileId, file, [
    Permission.read(Role.any()),
    Permission.update(Role.user(uploadedBy)),
    Permission.delete(Role.user(uploadedBy)),
  ]);

  // Create asset metadata in database
  const response = await getDatabases().createDocument(
    getDatabaseId(),
    getCollectionId("board_assets"),
    "unique()",
    {
      workspaceId,
      boardId: boardId || "",
      storageFileId: fileId,
      fileName: file.name,
      mimeType: file.type,
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: file.size,
      uploadedBy,
      createdAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.users()),
      Permission.update(Role.user(uploadedBy)),
      Permission.delete(Role.user(uploadedBy)),
    ],
  );

  return response as unknown as Asset;
}

/**
 * Get an asset by ID
 */
export async function getAsset(assetId: string): Promise<Asset> {
  const response = await getDatabases().getDocument(
    getDatabaseId(),
    getCollectionId("board_assets"),
    assetId,
  );
  return response as unknown as Asset;
}

/**
 * List assets for a workspace
 */
export async function listWorkspaceAssets(
  workspaceId: string,
): Promise<Asset[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("board_assets"),
    [Query.equal("workspaceId", workspaceId)],
  );
  return response.documents as unknown as Asset[];
}

/**
 * List assets for a board
 */
export async function listBoardAssets(boardId: string): Promise<Asset[]> {
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    getCollectionId("board_assets"),
    [Query.equal("boardId", boardId)],
  );
  return response.documents as unknown as Asset[];
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  // Get asset to find storage file ID
  const asset = await getAsset(assetId);

  // Delete from storage
  await getStorage().deleteFile(
    getBucketId("board_assets"),
    asset.storageFileId,
  );

  // Delete metadata
  await getDatabases().deleteDocument(
    getDatabaseId(),
    getCollectionId("board_assets"),
    assetId,
  );
}

/**
 * Update asset metadata
 */
export async function updateAsset(
  assetId: string,
  data: Partial<Pick<Asset, "boardId" | "thumbnailFileId">>,
): Promise<Asset> {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    getCollectionId("board_assets"),
    assetId,
    data,
  );
  return response as unknown as Asset;
}

/**
 * Get asset preview URL
 */
export function getAssetPreviewUrl(
  asset: Asset,
  width?: number,
  height?: number,
): string {
  return getFilePreview(
    getBucketId("board_assets"),
    asset.storageFileId,
    width,
    height,
  );
}

/**
 * Get image dimensions from a File
 */
async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a unique file ID
 */
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate and prepare file for upload
 */
export interface UploadValidation {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): UploadValidation {
  if (!isAllowedImageType(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"].join(", ")}`,
    };
  }
  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `File size exceeds maximum of 10MB`,
    };
  }
  return { valid: true };
}
