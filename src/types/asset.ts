/**
 * Asset Types
 * Defines the data model for board assets
 */

export interface Asset {
  $id: string;
  workspaceId: string;
  boardId?: string;
  storageFileId: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  thumbnailFileId?: string;
  exifJson?: string;
  gpsLat?: number;
  gpsLng?: number;
  uploadedBy: string;
  createdAt: string;
}

// Helper to parse EXIF data
export function parseExifData(asset: Asset): Record<string, unknown> | null {
  if (!asset.exifJson) return null;
  try {
    return JSON.parse(asset.exifJson);
  } catch {
    return null;
  }
}

// Asset creation helper
export interface CreateAssetInput {
  workspaceId: string;
  boardId?: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  uploadedBy: string;
}

// Allowed MIME types for upload
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Max file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validate if a file type is allowed
export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

// Validate file size
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Get file extension from MIME type
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return mimeToExt[mimeType] || "bin";
}
