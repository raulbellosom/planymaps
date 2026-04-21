/**
 * Appwrite Database Service
 * Provides typed wrappers for database operations
 */

import { getDatabases } from "./client";
import { getDatabaseId } from "@/env";
import { Query } from "appwrite";

export { getDatabaseId };

/**
 * Generic document creation
 */
export async function createDocument(
  databaseId: string,
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>,
  permissions?: string[],
) {
  return await getDatabases().createDocument(
    databaseId,
    collectionId,
    documentId,
    data,
    permissions,
  );
}

/**
 * Generic document retrieval
 */
export async function getDocument(
  databaseId: string,
  collectionId: string,
  documentId: string,
) {
  return await getDatabases().getDocument(databaseId, collectionId, documentId);
}

/**
 * Generic document update
 */
export async function updateDocument(
  databaseId: string,
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>,
  permissions?: string[],
) {
  return await getDatabases().updateDocument(
    databaseId,
    collectionId,
    documentId,
    data,
    permissions,
  );
}

/**
 * Generic document deletion
 */
export async function deleteDocument(
  databaseId: string,
  collectionId: string,
  documentId: string,
) {
  return await getDatabases().deleteDocument(
    databaseId,
    collectionId,
    documentId,
  );
}

/**
 * Generic document listing
 */
export async function listDocuments(
  databaseId: string,
  collectionId: string,
  queries?: string[],
) {
  return await getDatabases().listDocuments(databaseId, collectionId, queries);
}

/**
 * Find documents by attribute
 */
export async function findByAttribute(
  collectionId: string,
  attribute: string,
  value: string,
  databaseId?: string,
) {
  return await listDocuments(databaseId || getDatabaseId(), collectionId, [
    Query.equal(attribute, value),
  ]);
}
