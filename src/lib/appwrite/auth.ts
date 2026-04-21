/**
 * Appwrite Auth Service
 * Provides typed wrappers for authentication operations
 */

import { getAccount } from "./client";

/**
 * Get current authenticated user
 * Includes a timeout to prevent hanging on network issues
 */
export async function getCurrentUser() {
  try {
    const promise = getAccount().get();
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 10000); // 10 second timeout
    });
    return await Promise.race([promise, timeoutPromise]);
  } catch {
    return null;
  }
}

/**
 * Register a new user with email and password and create a session
 */
export async function register(email: string, password: string, name?: string) {
  await getAccount().create("unique()", email, password, name);
  // After registration, create a session to log the user in
  await getAccount().createEmailPasswordSession(email, password);
}

/**
 * Create email/password session (login)
 */
export async function login(email: string, password: string): Promise<void> {
  await getAccount().createEmailPasswordSession(email, password);
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  await getAccount().deleteSession("current");
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<Record<string, unknown>> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.prefs as Record<string, unknown>;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(prefs: Record<string, unknown>) {
  return await getAccount().updatePrefs(prefs);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string,
  url?: string,
): Promise<void> {
  const redirectUrl =
    url ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : "");
  await getAccount().createRecovery(email, redirectUrl);
}

/**
 * Complete password reset
 */
export async function completePasswordReset(
  userId: string,
  secret: string,
  password: string,
): Promise<void> {
  await getAccount().updateRecovery(userId, secret, password);
}

/**
 * Create email verification
 */
export async function createEmailVerification(): Promise<string> {
  const result = await getAccount().createVerification(
    `${typeof window !== "undefined" ? window.location.origin : ""}/verify`,
  );
  return result.$id;
}

/**
 * Verify email with secret
 */
export async function verifyEmailSecret(
  userId: string,
  secret: string,
): Promise<void> {
  await getAccount().updateVerification(userId, secret);
}

/**
 * List user sessions
 */
export async function listSessions() {
  return await getAccount().listSessions();
}

/**
 * Delete specific session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await getAccount().deleteSession(sessionId);
}

/**
 * Update user name
 */
export async function updateUserName(name: string) {
  return await getAccount().updateName(name);
}

/**
 * Update user email
 */
export async function updateUserEmail(email: string) {
  return await getAccount().updateEmail(
    email,
    `${typeof window !== "undefined" ? window.location.origin : ""}/verify`,
  );
}

/**
 * Update user password (requires current password)
 */
export async function updateUserPassword(
  oldPassword: string,
  newPassword: string,
) {
  // First verify the old password by creating a session
  await getAccount().createEmailPasswordSession(
    (await getCurrentUser())?.email || "",
    oldPassword,
  );
  // Then update to new password
  return await getAccount().updatePassword(newPassword);
}
