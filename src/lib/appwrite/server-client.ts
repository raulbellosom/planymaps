/**
 * Appwrite Server Client
 * Node.js-only client authenticated with the API key (not a user session).
 * Bypasses row-level security — only use in API routes and server components
 * where the caller has already been validated (e.g. token lookup, admin ops).
 *
 * NEVER import this file in client components or expose it to the browser.
 */

import { Client, Databases, Storage } from "node-appwrite";
import { publicEnv, serverEnv } from "@/env";

let serverClient: Client | null = null;
let serverDatabases: Databases | null = null;
let serverStorage: Storage | null = null;

function getServerClient(): Client {
  if (serverClient) return serverClient;

  if (!publicEnv.appwriteEndpoint || !publicEnv.appwriteProjectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }
  if (!serverEnv.appwriteApiKey) {
    throw new Error("Missing APPWRITE_API_KEY");
  }

  serverClient = new Client();
  serverClient
    .setEndpoint(publicEnv.appwriteEndpoint)
    .setProject(publicEnv.appwriteProjectId)
    .setKey(serverEnv.appwriteApiKey);

  return serverClient;
}

export function getServerDatabases(): Databases {
  if (!serverDatabases) {
    serverDatabases = new Databases(getServerClient());
  }
  return serverDatabases;
}

export function getServerStorage(): Storage {
  if (!serverStorage) {
    serverStorage = new Storage(getServerClient());
  }
  return serverStorage;
}
