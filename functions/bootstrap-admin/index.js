/**
 * Bootstrap Admin Function
 *
 * This function is triggered when a new user is created in Appwrite Auth.
 * If this is the first user in the system, it assigns the 'admin' label.
 *
 * Trigger Configuration:
 * - Event: users.*.create
 * - Resource: Project
 *
 * Environment Variables Required:
 * - APPWRITE_FUNCTION_API_ENDPOINT
 * - APPWRITE_FUNCTION_PROJECT_ID
 * - APPWRITE_FUNCTION_API_KEY
 */

const sdk = require("node-appwrite");

module.exports = async (req, res) => {
  const client = new sdk.Client();
  const users = new sdk.Users(client);

  // Initialize the Appwrite client with function environment variables
  client
    .setEndpoint(req.variables["APPWRITE_FUNCTION_API_ENDPOINT"])
    .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
    .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"]);

  try {
    // Only process user.create events
    const eventType = req.eventType || "";
    if (!eventType.includes("users.create")) {
      console.log("Not a user creation event, skipping...");
      return res.json({ handled: false, reason: "not_user_create_event" });
    }

    // Extract the new user ID from the event
    // The event format is typically: databases.{databaseId}.collections.{collectionId}.documents.{documentId}.create
    // But for users, it's: users.{userId}.create
    const eventParts = eventType.split(".");
    // eventParts[1] should be the user ID
    const newUserId = eventParts[1] || req.payload?.userId || req.payload?.$id;

    if (!newUserId) {
      console.log("Could not extract user ID from event");
      return res.json({ handled: false, reason: "no_user_id" });
    }

    console.log("Processing user creation for:", newUserId);

    // Check total user count
    const userList = await users.list([]);
    console.log("Total users in system:", userList.total);

    // If this is the first user, assign admin label
    if (userList.total === 1) {
      console.log("First user detected! Assigning admin label to:", newUserId);

      await users.updateLabels(newUserId, ["admin"]);

      console.log("Admin label successfully assigned to:", newUserId);
      return res.json({
        handled: true,
        action: "assigned_admin_label",
        userId: newUserId,
        message: "First user assigned admin label successfully",
      });
    }

    console.log("Not the first user, skipping...");
    return res.json({ handled: false, reason: "not_first_user" });
  } catch (error) {
    console.error("Bootstrap admin function error:", error);
    return res.json({
      handled: false,
      error: error.message,
      stack: error.stack,
    });
  }
};
