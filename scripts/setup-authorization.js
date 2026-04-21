/**
 * Appwrite Authorization System Setup Script
 *
 * Run this script to set up the complete authorization system in Appwrite.
 *
 * Usage: node scripts/setup-authorization.js
 *
 * IMPORTANT: This script requires the Appwrite CLI or direct API calls.
 * For manual setup, follow the instructions in docs/11-authorization-system.md
 */

const https = require("https");

// Configuration - Update these values for your Appwrite instance
const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://aprod.racoondevs.com/v1";
const APPWRITE_PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID || "YOUR_PROJECT_ID";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "YOUR_API_KEY";
const DATABASE_ID = "planymaps_db";

/**
 * Make an API request to Appwrite
 */
function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${APPWRITE_ENDPOINT}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": APPWRITE_API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(
              new Error(
                `API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`,
              ),
            );
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Create a table/collection
 */
async function createTable(name, tableId) {
  console.log(`Creating table: ${name} (${tableId})`);
  try {
    const result = await apiRequest(
      "POST",
      `/databases/${DATABASE_ID}/tables`,
      {
        name,
        tableId,
        documentSecurity: false,
      },
    );
    console.log(`  ✓ Created ${name}`);
    return result;
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`  ✓ ${name} already exists`);
      return null;
    }
    throw error;
  }
}

/**
 * Add a column to a table
 */
async function addColumn(
  databaseId,
  tableId,
  key,
  type,
  required,
  size = null,
  options = null,
) {
  console.log(`  Adding column: ${key} (${type})`);
  const columnData = {
    key,
    type,
    required,
    ...(size && { size }),
    ...(options && { options }),
  };

  try {
    await apiRequest(
      "POST",
      `/databases/${databaseId}/tables/${tableId}/columns`,
      columnData,
    );
    console.log(`    ✓ Column ${key} added`);
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`    ✓ Column ${key} already exists`);
    } else {
      throw error;
    }
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log("=== Appwrite Authorization System Setup ===\n");

  try {
    // 1. Create workspace_invitations table
    console.log("\n--- Creating workspace_invitations table ---");
    await createTable("Workspace Invitations", "workspace_invitations");

    // Add columns
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "workspaceId",
      "string",
      true,
      256,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "inviterUserId",
      "string",
      true,
      256,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "inviteeEmail",
      "string",
      true,
      256,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "inviteeUserId",
      "string",
      false,
      256,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "role",
      "string",
      true,
      32,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "status",
      "string",
      true,
      32,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "expiresAt",
      "datetime",
      true,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "acceptedAt",
      "datetime",
      false,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "rejectedAt",
      "datetime",
      false,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "revokedAt",
      "datetime",
      false,
    );
    await addColumn(
      DATABASE_ID,
      "workspace_invitations",
      "createdAt",
      "datetime",
      true,
    );

    // 2. Create notifications table
    console.log("\n--- Creating notifications table ---");
    await createTable("Notifications", "notifications");

    // Add columns
    await addColumn(
      DATABASE_ID,
      "notifications",
      "userId",
      "string",
      true,
      256,
    );
    await addColumn(DATABASE_ID, "notifications", "type", "string", true, 64);
    await addColumn(DATABASE_ID, "notifications", "title", "string", true, 256);
    await addColumn(
      DATABASE_ID,
      "notifications",
      "message",
      "string",
      true,
      1000,
    );
    await addColumn(
      DATABASE_ID,
      "notifications",
      "data",
      "string",
      false,
      5000,
    );
    await addColumn(DATABASE_ID, "notifications", "isRead", "boolean", true);
    await addColumn(
      DATABASE_ID,
      "notifications",
      "createdAt",
      "datetime",
      true,
    );
    await addColumn(DATABASE_ID, "notifications", "readAt", "datetime", false);

    console.log("\n=== Setup Complete ===");
    console.log(
      "\nNOTE: You need to manually create indexes in the Appwrite Console:",
    );
    console.log(
      "- workspace_invitations: idx_invitee_email, idx_invitee_user, idx_workspace, idx_status",
    );
    console.log("- notifications: idx_user, idx_user_unread, idx_created");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run setup
setup();
