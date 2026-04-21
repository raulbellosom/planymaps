/**
 * Appwrite Client Configuration
 * Centralizes Appwrite SDK initialization with proper environment validation
 */

import { Client, Account, Databases, Storage, Functions } from "appwrite";
import { publicEnv } from "@/env";

// Singleton client instance
let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | null = null;
let storage: Storage | null = null;
let functions: Functions | null = null;

/**
 * Initialize the Appwrite client
 * Call this once at app initialization
 */
export function initAppwrite(): Client {
  if (client) {
    return client;
  }

  // Validate required environment variables
  if (!publicEnv.appwriteEndpoint || !publicEnv.appwriteProjectId) {
    throw new Error(
      "Missing required Appwrite configuration. Ensure NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID are set.",
    );
  }

  client = new Client();

  client
    .setEndpoint(publicEnv.appwriteEndpoint)
    .setProject(publicEnv.appwriteProjectId);

  return client;
}

/**
 * Get the Appwrite client instance
 * Initializes if not already done
 */
export function getClient(): Client {
  if (!client) {
    return initAppwrite();
  }
  return client;
}

/**
 * Get the Account service
 */
export function getAccount(): Account {
  if (!account) {
    account = new Account(getClient());
  }
  return account;
}

/**
 * Get the Databases service
 */
export function getDatabases(): Databases {
  if (!databases) {
    databases = new Databases(getClient());
  }
  return databases;
}

/**
 * Get the Storage service
 */
export function getStorage(): Storage {
  if (!storage) {
    storage = new Storage(getClient());
  }
  return storage;
}

/**
 * Get the Functions service
 */
export function getFunctions(): Functions {
  if (!functions) {
    functions = new Functions(getClient());
  }
  return functions;
}

/**
 * Check if Appwrite is properly configured
 */
export function isAppwriteConfigured(): boolean {
  return !!(publicEnv.appwriteEndpoint && publicEnv.appwriteProjectId);
}

/**
 * Reset client (useful for testing or logout)
 */
export function resetAppwrite(): void {
  client = null;
  account = null;
  databases = null;
  storage = null;
  functions = null;
}

// Re-export types for convenience
export type { Client, Account, Databases, Storage, Functions };
