/**
 * Migration: grant read("any") on board_assets STORAGE FILES so Konva can load
 * them via crossOrigin="anonymous" (canvas images cannot send credentials).
 * DB documents retain read("users") — they are accessed via the authenticated SDK.
 *
 * Run 1 already granted read("users") on both storage files and DB documents.
 * Run 2 (this run) upgrades storage files from read("users") → read("any").
 *
 * Usage:
 *   APPWRITE_API_KEY=<key> node scripts/fix-asset-permissions.js
 *
 * Optional overrides (env vars):
 *   APPWRITE_ENDPOINT   (default: https://aprod.racoondevs.com/v1)
 *   APPWRITE_PROJECT_ID (default: planymaps)
 */

const { Client, Databases, Storage, Query } = require("node-appwrite");

const ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://aprod.racoondevs.com/v1";
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "planymaps";
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = "planymaps_db";
const COLLECTION_ID = "board_assets";
const BUCKET_ID = "board_assets";
const READ_ANY_PERM = 'read("any")';
const READ_USERS_PERM = 'read("users")';

if (!API_KEY) {
  console.error("Error: APPWRITE_API_KEY environment variable is required");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);
const storage = new Storage(client);

/**
 * Upgrade a storage file's permissions: replace read("users") with read("any"),
 * or add read("any") if neither perm is present.
 * Returns null if read("any") is already set (no update needed).
 */
function upgradeStorageReadPerm(existing) {
  if (existing.includes(READ_ANY_PERM)) return null;
  // Replace read("users") if present, otherwise just append read("any")
  const without = existing.filter((p) => p !== READ_USERS_PERM);
  return [...without, READ_ANY_PERM];
}

/**
 * Merge READ_USERS_PERM into an existing permissions array.
 * Returns null if the permission is already present (no update needed).
 */
function mergeReadPerm(existing) {
  if (existing.includes(READ_USERS_PERM)) return null;
  return [...existing, READ_USERS_PERM];
}

/**
 * Paginate through all storage files in the bucket and grant read("any").
 * Konva loads images with crossOrigin="anonymous" — no credentials are sent,
 * so read("users") is not enough; files must be publicly readable.
 */
async function fixStorageFiles() {
  console.log(`\n[Storage] Scanning bucket: ${BUCKET_ID}`);
  let offset = 0;
  const limit = 100;
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  while (true) {
    const { files, total } = await storage.listFiles(BUCKET_ID, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (files.length === 0) break;

    for (const file of files) {
      processed++;
      const newPerms = upgradeStorageReadPerm(file.$permissions);
      if (newPerms === null) {
        skipped++;
        continue;
      }
      try {
        await storage.updateFile(BUCKET_ID, file.$id, undefined, newPerms);
        updated++;
        process.stdout.write(`  ✓ Updated file: ${file.$id}\n`);
      } catch (err) {
        errors++;
        console.error(`  ✗ Failed file ${file.$id}: ${err.message}`);
      }
    }

    offset += files.length;
    if (offset >= total) break;
  }

  console.log(
    `[Storage] Done — processed: ${processed}, updated: ${updated}, already ok: ${skipped}, errors: ${errors}`,
  );
  return errors;
}

/**
 * Paginate through all documents in the board_assets collection and grant read("users").
 */
async function fixDatabaseDocuments() {
  console.log(`\n[Database] Scanning collection: ${COLLECTION_ID}`);
  let offset = 0;
  const limit = 100;
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  while (true) {
    const { documents, total } = await db.listDocuments(DB_ID, COLLECTION_ID, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (documents.length === 0) break;

    for (const doc of documents) {
      processed++;
      const newPerms = mergeReadPerm(doc.$permissions);
      if (newPerms === null) {
        skipped++;
        continue;
      }
      try {
        await db.updateDocument(
          DB_ID,
          COLLECTION_ID,
          doc.$id,
          undefined,
          newPerms,
        );
        updated++;
        process.stdout.write(`  ✓ Updated document: ${doc.$id}\n`);
      } catch (err) {
        errors++;
        console.error(`  ✗ Failed document ${doc.$id}: ${err.message}`);
      }
    }

    offset += documents.length;
    if (offset >= total) break;
  }

  console.log(
    `[Database] Done — processed: ${processed}, updated: ${updated}, already ok: ${skipped}, errors: ${errors}`,
  );
  return errors;
}

async function main() {
  console.log("=== fix-asset-permissions ===");
  console.log(`Endpoint : ${ENDPOINT}`);
  console.log(`Project  : ${PROJECT_ID}`);
  console.log(`Database : ${DB_ID}`);
  console.log(`Bucket   : ${BUCKET_ID}`);
  console.log(
    '\nUpgrading storage files to read("any") and ensuring DB documents have read("users")...',
  );

  const storageErrors = await fixStorageFiles();
  const dbErrors = await fixDatabaseDocuments();

  const totalErrors = storageErrors + dbErrors;
  if (totalErrors > 0) {
    console.error(
      `\n⚠  Migration completed with ${totalErrors} error(s). Review the output above.`,
    );
    process.exit(1);
  } else {
    console.log("\n✅ Migration completed successfully.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
