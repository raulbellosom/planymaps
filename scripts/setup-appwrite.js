/**
 * Appwrite Backend Setup Script
 *
 * This script sets up the complete Appwrite backend for Planymaps.
 *
 * Prerequisites:
 * 1. Appwrite CLI installed: npm install -g appwrite-cli
 * 2. Or use the Appwrite Console to create resources manually
 * 3. API key with sufficient permissions
 *
 * Usage:
 * node scripts/setup-appwrite.js
 *
 * Environment variables required:
 * APPWRITE_ENDPOINT - Appwrite server endpoint
 * APPWRITE_PROJECT_ID - Your project ID
 * APPWRITE_API_KEY - Your API key
 */

const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://aprod.racoondevs.com/v1";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "planymaps";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = "planymaps_db";
const STORAGE_BUCKET_ASSETS = "board_assets";
const STORAGE_BUCKET_THUMBNAILS = "board_thumbnails";

// Collections schema
const COLLECTIONS = {
  workspaces: {
    name: "Workspaces",
    columns: [
      { key: "name", type: "string", size: 256, required: true },
      { key: "slug", type: "string", size: 256, required: false },
      { key: "description", type: "text", required: false },
      { key: "ownerId", type: "string", size: 256, required: true },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "idx_owner", type: "key", columns: ["ownerId"] },
      { key: "idx_slug", type: "key", columns: ["slug"] },
    ],
  },
  workspace_members: {
    name: "Workspace Members",
    columns: [
      { key: "workspaceId", type: "string", size: 256, required: true },
      { key: "userId", type: "string", size: 256, required: true },
      { key: "role", type: "string", size: 32, required: true }, // owner, admin, editor, viewer
      { key: "createdAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "idx_workspace", type: "key", columns: ["workspaceId"] },
      { key: "idx_user", type: "key", columns: ["userId"] },
    ],
  },
  boards: {
    name: "Boards",
    columns: [
      { key: "workspaceId", type: "string", size: 256, required: true },
      { key: "name", type: "string", size: 256, required: true },
      { key: "description", type: "text", required: false },
      { key: "mode", type: "string", size: 32, required: true }, // visual, geo
      { key: "width", type: "integer", required: true },
      { key: "height", type: "integer", required: true },
      { key: "backgroundType", type: "string", size: 32, required: true }, // none, color, image, map
      { key: "backgroundColor", type: "string", size: 32, required: false },
      { key: "backgroundAssetId", type: "string", size: 256, required: false },
      { key: "viewportState", type: "text", required: false },
      { key: "isArchived", type: "boolean", required: true },
      { key: "createdBy", type: "string", size: 256, required: true },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "idx_workspace", type: "key", columns: ["workspaceId"] },
      { key: "idx_archived", type: "key", columns: ["isArchived"] },
    ],
  },
  board_layers: {
    name: "Board Layers",
    columns: [
      { key: "boardId", type: "string", size: 256, required: true },
      { key: "name", type: "string", size: 256, required: true },
      { key: "orderIndex", type: "integer", required: true },
      { key: "visible", type: "boolean", required: true },
      { key: "locked", type: "boolean", required: true },
      { key: "opacity", type: "double", required: true },
      { key: "blendMode", type: "string", size: 32, required: false },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [{ key: "idx_board", type: "key", columns: ["boardId"] }],
  },
  board_items: {
    name: "Board Items",
    columns: [
      { key: "boardId", type: "string", size: 256, required: true },
      { key: "layerId", type: "string", size: 256, required: true },
      { key: "parentGroupId", type: "string", size: 256, required: false },
      { key: "type", type: "string", size: 32, required: true }, // rectangle, ellipse, line, arrow, text, image, pin, group
      { key: "name", type: "string", size: 256, required: true },
      { key: "orderIndex", type: "integer", required: true },
      { key: "visible", type: "boolean", required: true },
      { key: "locked", type: "boolean", required: true },
      { key: "opacity", type: "double", required: true },
      { key: "x", type: "double", required: true },
      { key: "y", type: "double", required: true },
      { key: "width", type: "double", required: true },
      { key: "height", type: "double", required: true },
      { key: "rotation", type: "double", required: true },
      { key: "scaleX", type: "double", required: true },
      { key: "scaleY", type: "double", required: true },
      { key: "styleJson", type: "text", required: true },
      { key: "contentJson", type: "text", required: true },
      { key: "interactionJson", type: "text", required: true },
      { key: "geoJson", type: "text", required: false },
      { key: "createdBy", type: "string", size: 256, required: true },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
      { key: "deletedAt", type: "datetime", required: false },
    ],
    indexes: [
      { key: "idx_board", type: "key", columns: ["boardId"] },
      { key: "idx_layer", type: "key", columns: ["layerId"] },
      { key: "idx_deleted", type: "key", columns: ["deletedAt"] },
    ],
  },
  board_assets: {
    name: "Board Assets",
    columns: [
      { key: "boardId", type: "string", size: 64, required: true },
      { key: "name", type: "string", size: 255, required: true },
      { key: "mimeType", type: "string", size: 64, required: true },
      { key: "sizeBytes", type: "integer", required: true },
      { key: "storageBucket", type: "string", size: 64, required: true },
      { key: "storagePath", type: "string", size: 512, required: true },
      { key: "width", type: "integer", required: false },
      { key: "height", type: "integer", required: false },
      { key: "exifJson", type: "text", required: false },
      { key: "geoJson", type: "text", required: false },
      { key: "createdBy", type: "string", size: 64, required: true },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
      { key: "deletedAt", type: "datetime", required: false },
    ],
    indexes: [{ key: "idx_board", type: "key", columns: ["boardId"] }],
  },
};

async function setup() {
  if (!APPWRITE_API_KEY) {
    console.error("Error: APPWRITE_API_KEY environment variable is required");
    console.log(
      "\nTo set up Appwrite manually, follow these steps in the Appwrite Console:",
    );
    console.log('1. Create a database named "planymaps_db"');
    console.log(
      "2. Create the collections listed in docs/07-appwrite-backend.md",
    );
    console.log(
      '3. Create storage buckets: "board_assets" and "board_thumbnails"',
    );
    console.log("4. Set up permissions for each collection");
    return;
  }

  console.log("Setting up Appwrite backend...");
  console.log(`Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`Project ID: ${APPWRITE_PROJECT_ID}`);

  // Note: This is a documentation script showing the schema
  // Actual API calls would require the Appwrite SDK or CLI
  // For now, we output the schema for manual setup or CLI usage

  console.log("\n=== DATABASE SCHEMA ===\n");
  console.log(`Database ID: ${DATABASE_ID}`);
  console.log("\nCollections:");

  for (const [id, collection] of Object.entries(COLLECTIONS)) {
    console.log(`\n  ${id}:`);
    console.log(`    Name: ${collection.name}`);
    console.log("    Columns:");
    for (const col of collection.columns) {
      const req = col.required ? " (required)" : " (optional)";
      console.log(`      - ${col.key}: ${col.type}${req}`);
    }
    console.log("    Indexes:");
    for (const idx of collection.indexes) {
      console.log(`      - ${idx.key}: ${idx.type}(${idx.columns.join(", ")})`);
    }
  }

  console.log("\n=== STORAGE BUCKETS ===\n");
  console.log(`  - ${STORAGE_BUCKET_ASSETS} (for uploaded images)`);
  console.log(`  - ${STORAGE_BUCKET_THUMBNAILS} (for generated thumbnails)`);

  console.log("\n=== MANUAL SETUP INSTRUCTIONS ===\n");
  console.log("1. Go to your Appwrite Console");
  console.log("2. Navigate to Databases > Create database");
  console.log("   - Name: Planymaps Database");
  console.log("   - ID: planymaps_db");
  console.log(
    "3. For each collection above, create a new table with the specified columns",
  );
  console.log(
    "4. Create indexes on the specified columns for query performance",
  );
  console.log("5. Go to Storage > Create bucket");
  console.log("   - Bucket 1: board_assets");
  console.log("   - Bucket 2: board_thumbnails");
  console.log("6. Set permissions to allow authenticated users read/write");
}

setup();
