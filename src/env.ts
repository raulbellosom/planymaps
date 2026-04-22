/**
 * Centralized environment variable access for Planymaps
 * Validates required variables at runtime for early failure
 *
 * IMPORTANT: All environment-dependent values MUST be configured here.
 * Never hardcode IDs, API keys, or URLs inline in the codebase.
 * All configurable values must exist in .env and .env.example.
 */

/**
 * Public environment variables (exposed to client)
 * These are prefixed with NEXT_PUBLIC_ and are safe to expose
 */
export const publicEnv = {
  // Appwrite
  appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,

  // App IDs
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Planymaps",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,

  // Database ID
  appwriteDatabaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,

  // Collection IDs
  appwriteCollectionWorkspaces:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WORKSPACES,
  appwriteCollectionWorkspaceMembers:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WORKSPACE_MEMBERS,
  appwriteCollectionBoards: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOARDS,
  appwriteCollectionBoardLayers:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOARD_LAYERS,
  appwriteCollectionBoardItems:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOARD_ITEMS,
  appwriteCollectionBoardAssets:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOARD_ASSETS,
  appwriteCollectionShareLinks:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SHARE_LINKS,

  // Storage Bucket IDs
  appwriteBucketBoardAssets:
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_BOARD_ASSETS,
  appwriteBucketBoardThumbnails:
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_BOARD_THUMBNAILS,

  // Map/Geolocation
  mapTileProvider: process.env.NEXT_PUBLIC_MAP_TILE_PROVIDER || "osm",
  // mapProviderApiKey: process.env.NEXT_PUBLIC_MAP_PROVIDER_API_KEY,
} as const;

/**
 * Server-only environment variables (not exposed to client)
 * These contain sensitive data like API keys
 */
export const serverEnv = {
  // Appwrite
  appwriteApiKey: process.env.APPWRITE_API_KEY,

  // Database ID (server-side)
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID,

  // Collection IDs (server-side)
  appwriteCollectionWorkspaces: process.env.APPWRITE_COLLECTION_WORKSPACES,
  appwriteCollectionWorkspaceMembers:
    process.env.APPWRITE_COLLECTION_WORKSPACE_MEMBERS,
  appwriteCollectionBoards: process.env.APPWRITE_COLLECTION_BOARDS,
  appwriteCollectionBoardLayers: process.env.APPWRITE_COLLECTION_BOARD_LAYERS,
  appwriteCollectionBoardItems: process.env.APPWRITE_COLLECTION_BOARD_ITEMS,
  appwriteCollectionBoardAssets: process.env.APPWRITE_COLLECTION_BOARD_ASSETS,
  appwriteCollectionShareLinks: process.env.APPWRITE_COLLECTION_SHARE_LINKS,

  // Storage Bucket IDs (server-side)
  appwriteBucketBoardAssets: process.env.APPWRITE_BUCKET_BOARD_ASSETS,
  appwriteBucketBoardThumbnails: process.env.APPWRITE_BUCKET_BOARD_THUMBNAILS,
} as const;

/**
 * Validate that required public environment variables are set
 * Call this in the app initialization or layout
 */
export function validatePublicEnv(): void {
  const missing: string[] = [];

  if (!publicEnv.appwriteEndpoint) {
    missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  }
  if (!publicEnv.appwriteProjectId) {
    missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Validate that required server environment variables are set
 * Call this in server-only contexts (API routes, server components)
 */
export function validateServerEnv(): void {
  const missing: string[] = [];

  if (!serverEnv.appwriteApiKey) {
    missing.push("APPWRITE_API_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Get Appwrite configuration object for client initialization
 */
export function getAppwriteConfig() {
  return {
    endpoint: publicEnv.appwriteEndpoint!,
    projectId: publicEnv.appwriteProjectId!,
  };
}

/**
 * Get database ID (works on both client and server)
 */
export function getDatabaseId(): string {
  return (
    publicEnv.appwriteDatabaseId ||
    serverEnv.appwriteDatabaseId ||
    "planymaps_db"
  );
}

/**
 * Get collection ID helper
 */
export function getCollectionId(
  type:
    | "workspaces"
    | "workspace_members"
    | "boards"
    | "board_layers"
    | "board_items"
    | "board_assets"
    | "workspace_invitations"
    | "notifications"
    | "share_links",
): string {
  const collectionMap: Record<string, string> = {
    workspaces:
      publicEnv.appwriteCollectionWorkspaces ||
      serverEnv.appwriteCollectionWorkspaces ||
      "workspaces",
    workspace_members:
      publicEnv.appwriteCollectionWorkspaceMembers ||
      serverEnv.appwriteCollectionWorkspaceMembers ||
      "workspace_members",
    boards:
      publicEnv.appwriteCollectionBoards ||
      serverEnv.appwriteCollectionBoards ||
      "boards",
    board_layers:
      publicEnv.appwriteCollectionBoardLayers ||
      serverEnv.appwriteCollectionBoardLayers ||
      "board_layers",
    board_items:
      publicEnv.appwriteCollectionBoardItems ||
      serverEnv.appwriteCollectionBoardItems ||
      "board_items",
    board_assets:
      publicEnv.appwriteCollectionBoardAssets ||
      serverEnv.appwriteCollectionBoardAssets ||
      "board_assets",
    workspace_invitations: "workspace_invitations",
    notifications: "notifications",
    share_links:
      publicEnv.appwriteCollectionShareLinks ||
      serverEnv.appwriteCollectionShareLinks ||
      "share_links",
  };
  return collectionMap[type];
}

/**
 * Get bucket ID helper
 */
export function getBucketId(type: "board_assets" | "board_thumbnails"): string {
  const bucketMap: Record<string, string> = {
    board_assets:
      publicEnv.appwriteBucketBoardAssets ||
      serverEnv.appwriteBucketBoardAssets ||
      "board_assets",
    board_thumbnails:
      publicEnv.appwriteBucketBoardThumbnails ||
      serverEnv.appwriteBucketBoardThumbnails ||
      "board_thumbnails",
  };
  return bucketMap[type];
}

// Type definitions for environment variables
export type PublicEnv = typeof publicEnv;
export type ServerEnv = typeof serverEnv;
