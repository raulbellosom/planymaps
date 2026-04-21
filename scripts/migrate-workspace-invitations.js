/**
 * Migration: add missing attributes to workspace_invitations collection.
 *
 * The original collection was created with only:
 *   workspaceId, inviteeEmail, role, status, inviterUserId, expiresAt
 *
 * This script adds:
 *   inviteeUserId (string, optional)
 *   acceptedAt    (datetime, optional)
 *   rejectedAt    (datetime, optional)
 *   revokedAt     (datetime, optional)
 *   createdAt     (datetime, required, default = existing docs get null — safe)
 *
 * And creates the index:
 *   idx_invitee_user on [inviteeUserId]
 *
 * Usage:
 *   APPWRITE_API_KEY=<key> node scripts/migrate-workspace-invitations.js
 *
 * Optional overrides (env vars):
 *   APPWRITE_ENDPOINT   (default: https://aprod.racoondevs.com/v1)
 *   APPWRITE_PROJECT_ID (default: planymaps)
 */

const { Client, Databases, IndexType } = require("node-appwrite");

const ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://aprod.racoondevs.com/v1";
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "planymaps";
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = "planymaps_db";
const COLLECTION_ID = "workspace_invitations";

if (!API_KEY) {
  console.error("Error: APPWRITE_API_KEY environment variable is required");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

async function addAttributeIfMissing(addFn, key) {
  try {
    await addFn();
    console.log(`  ✓ Added attribute: ${key}`);
  } catch (err) {
    if (
      err?.code === 409 ||
      err?.message?.includes("already exists") ||
      err?.message?.includes("Attribute with the requested key already exists")
    ) {
      console.log(`  – Attribute already exists (skipped): ${key}`);
    } else {
      throw err;
    }
  }
}

async function addIndexIfMissing(key, type, attributes, orders) {
  try {
    await db.createIndex(DB_ID, COLLECTION_ID, key, type, attributes, orders);
    console.log(`  ✓ Created index: ${key}`);
  } catch (err) {
    if (
      err?.code === 409 ||
      err?.message?.includes("already exists") ||
      err?.message?.includes("Index with the requested key already exists")
    ) {
      console.log(`  – Index already exists (skipped): ${key}`);
    } else {
      throw err;
    }
  }
}

async function waitForAttributes(keys, maxWaitMs = 30000) {
  const interval = 1500;
  let elapsed = 0;
  while (elapsed < maxWaitMs) {
    const col = await db.getCollection(DB_ID, COLLECTION_ID);
    const existingKeys = new Set(col.attributes.map((a) => a.key));
    const pending = keys.filter((k) => !existingKeys.has(k));
    if (pending.length === 0) return;
    console.log(
      `  Waiting for attributes to become available: ${pending.join(", ")}...`,
    );
    await new Promise((r) => setTimeout(r, interval));
    elapsed += interval;
  }
  console.warn(
    "  Warning: timed out waiting for attributes — index creation may fail.",
  );
}

async function run() {
  console.log(`Migrating collection '${COLLECTION_ID}' in database '${DB_ID}'`);
  console.log(`Endpoint : ${ENDPOINT}`);
  console.log(`Project  : ${PROJECT_ID}\n`);

  console.log("Adding attributes...");

  await addAttributeIfMissing(
    () =>
      db.createStringAttribute(
        DB_ID,
        COLLECTION_ID,
        "inviteeUserId",
        256,
        false, // required = false
        null, // default
        false, // array
        false, // encrypt
      ),
    "inviteeUserId",
  );

  await addAttributeIfMissing(
    () =>
      db.createDatetimeAttribute(
        DB_ID,
        COLLECTION_ID,
        "acceptedAt",
        false, // required = false
        null,
      ),
    "acceptedAt",
  );

  await addAttributeIfMissing(
    () =>
      db.createDatetimeAttribute(
        DB_ID,
        COLLECTION_ID,
        "rejectedAt",
        false,
        null,
      ),
    "rejectedAt",
  );

  await addAttributeIfMissing(
    () =>
      db.createDatetimeAttribute(
        DB_ID,
        COLLECTION_ID,
        "revokedAt",
        false,
        null,
      ),
    "revokedAt",
  );

  await addAttributeIfMissing(
    () =>
      db.createDatetimeAttribute(
        DB_ID,
        COLLECTION_ID,
        "createdAt",
        false, // required = false so existing docs without it are not invalidated
        null,
      ),
    "createdAt",
  );

  console.log("\nWaiting for Appwrite to make new attributes available...");
  await waitForAttributes([
    "inviteeUserId",
    "acceptedAt",
    "rejectedAt",
    "revokedAt",
    "createdAt",
  ]);

  console.log("\nAdding indexes...");

  await addIndexIfMissing(
    "idx_invitee_user",
    IndexType.Key,
    ["inviteeUserId"],
    [],
  );

  console.log("\nMigration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err?.message ?? err);
  process.exit(1);
});
