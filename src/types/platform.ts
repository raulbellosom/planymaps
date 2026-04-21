/**
 * Platform Types
 * Defines platform-level authorization using Appwrite Auth labels
 */

/**
 * Platform labels for Appwrite Auth users
 * These define what a user can do across the entire platform
 */
export type PlatformLabel = "admin" | "user";

/**
 * Check if a user has the admin platform label
 */
export function isPlatformAdmin(user: { labels?: string[] } | null): boolean {
  return user?.labels?.includes("admin") ?? false;
}

/**
 * Check if a user has the user platform label (default)
 */
export function isRegularUser(user: { labels?: string[] } | null): boolean {
  return user?.labels?.includes("user") || !user?.labels?.length;
}

/**
 * Get the effective platform label for a user
 * Returns 'admin' if user has admin label, otherwise 'user'
 */
export function getEffectivePlatformLabel(
  user: { labels?: string[] } | null,
): PlatformLabel {
  return isPlatformAdmin(user) ? "admin" : "user";
}

/**
 * Platform user with typed labels
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
