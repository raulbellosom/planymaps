"use client";

/**
 * useAuth Hook
 * Thin proxy over AuthContext — no state, no network calls.
 * All state lives in AuthProvider which is mounted once at the root.
 */

import { useAuthContext } from "@/contexts/auth-context";

export function useAuth() {
  return useAuthContext();
}
