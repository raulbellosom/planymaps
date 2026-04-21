/**
 * Platform Admin Service
 * Server-side operations for managing platform users and labels using REST API
 * IMPORTANT: All functions here should only be callable by admin users
 */

import { publicEnv, serverEnv } from "@/env";

// Platform label types
export type PlatformLabel = "admin" | "user";

/**
 * User with labels interface
 */
export interface PlatformUser {
  $id: string;
  name?: string;
  email: string;
  labels: PlatformLabel[];
  status: boolean;
  emailVerification: boolean;
  createdAt: string;
}

/**
 * Get API headers for Appwrite REST API calls
 */
function getApiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": publicEnv.appwriteProjectId!,
    "X-Appwrite-Key": serverEnv.appwriteApiKey!,
  };
}

/**
 * Get the base URL for Appwrite API
 */
function getApiUrl(): string {
  return `${publicEnv.appwriteEndpoint}`;
}

/**
 * Map Appwrite user response to PlatformUser
 */
function mapUserResponse(user: Record<string, unknown>): PlatformUser {
  return {
    $id: user.$id as string,
    name: user.name as string | undefined,
    email: user.email as string,
    labels: ((user.labels as string[]) || []) as PlatformLabel[],
    status: user.status as boolean,
    emailVerification: user.emailVerification as boolean,
    createdAt: user.registration as string,
  };
}

/**
 * List all users (admin only)
 */
export async function listAllUsers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: PlatformUser[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.search) params.append("search", options.search);
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.offset) params.append("offset", String(options.offset));

  const response = await fetch(`${getApiUrl()}/users?${params.toString()}`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list users: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    users: (data.users || []).map(mapUserResponse),
    total: data.total || 0,
  };
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(userId: string): Promise<PlatformUser> {
  const response = await fetch(`${getApiUrl()}/users/${userId}`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.statusText}`);
  }

  const user = await response.json();
  return mapUserResponse(user);
}

/**
 * Update user labels (admin only)
 */
export async function updateUserLabels(
  userId: string,
  labels: PlatformLabel[],
): Promise<PlatformUser> {
  const response = await fetch(`${getApiUrl()}/users/${userId}/labels`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify({ labels }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update labels: ${response.statusText}`);
  }

  const user = await response.json();
  return mapUserResponse(user);
}

/**
 * Add a label to a user (admin only)
 */
export async function addLabelToUser(
  userId: string,
  label: PlatformLabel,
): Promise<PlatformUser> {
  const user = await getUserById(userId);
  if (!user.labels.includes(label)) {
    const newLabels = [...user.labels, label];
    return updateUserLabels(userId, newLabels);
  }
  return user;
}

/**
 * Remove a label from a user (admin only)
 */
export async function removeLabelFromUser(
  userId: string,
  label: PlatformLabel,
): Promise<PlatformUser> {
  const user = await getUserById(userId);
  const newLabels = user.labels.filter((l) => l !== label);
  return updateUserLabels(userId, newLabels);
}

/**
 * Check if user has admin label
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    return user.labels.includes("admin");
  } catch {
    return false;
  }
}

/**
 * Get total user count
 */
export async function getUserCount(): Promise<number> {
  const response = await fetch(`${getApiUrl()}/users`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get user count: ${response.statusText}`);
  }

  const data = await response.json();
  return data.total || 0;
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(userId: string): Promise<PlatformUser> {
  return addLabelToUser(userId, "admin");
}

/**
 * Demote user from admin
 */
export async function demoteFromAdmin(userId: string): Promise<PlatformUser> {
  return removeLabelFromUser(userId, "admin");
}

/**
 * Update user status (active/inactive)
 */
export async function updateUserStatus(
  userId: string,
  status: boolean,
): Promise<PlatformUser> {
  const response = await fetch(`${getApiUrl()}/users/${userId}/status`, {
    method: "PATCH",
    headers: getApiHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update status: ${response.statusText}`);
  }

  const user = await response.json();
  return mapUserResponse(user);
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/users/${userId}`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.statusText}`);
  }
}
