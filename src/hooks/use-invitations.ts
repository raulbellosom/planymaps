"use client";

/**
 * useInvitations Hook
 * Manages pending workspace invitations for the current user with live
 * Appwrite Realtime updates.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { WorkspaceInvitation } from "@/types/invitation";
import {
  getPendingInvitationsForUser,
  acceptInvitation,
  rejectInvitation,
} from "@/services/invitation-service";
import { subscribeToUserInvitations } from "@/lib/realtime/realtime-service";
import { useAuth } from "@/hooks/use-auth";

interface UseInvitationsReturn {
  invitations: WorkspaceInvitation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  accept: (invitationId: string) => Promise<void>;
  reject: (invitationId: string) => Promise<void>;
}

export function useInvitations(): UseInvitationsReturn {
  const { user } = useAuth();
  const userId = user?.$id ?? null;

  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const pending = await getPendingInvitationsForUser(userId);
      if (!mountedRef.current) return;
      setInvitations(pending);
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load invitations";
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserInvitations(userId, {
      onCreated: (invitation) => {
        if (!mountedRef.current) return;
        if (invitation.status !== "pending") return;
        setInvitations((prev) => {
          if (prev.some((i) => i.$id === invitation.$id)) return prev;
          return [invitation, ...prev];
        });
      },
      onUpdated: (invitation) => {
        if (!mountedRef.current) return;
        setInvitations((prev) => {
          const exists = prev.some((i) => i.$id === invitation.$id);
          // If the invitation left the pending state, remove it
          if (invitation.status !== "pending") {
            return prev.filter((i) => i.$id !== invitation.$id);
          }
          if (!exists) return [invitation, ...prev];
          return prev.map((i) => (i.$id === invitation.$id ? invitation : i));
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const accept = useCallback(
    async (invitationId: string) => {
      if (!userId) return;
      try {
        await acceptInvitation(invitationId);
        // Realtime will drop it from the list; also remove optimistically
        setInvitations((prev) => prev.filter((i) => i.$id !== invitationId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to accept invitation";
        setError(message);
        throw err;
      }
    },
    [userId],
  );

  const reject = useCallback(
    async (invitationId: string) => {
      if (!userId) return;
      try {
        await rejectInvitation(invitationId, userId);
        setInvitations((prev) => prev.filter((i) => i.$id !== invitationId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reject invitation";
        setError(message);
        throw err;
      }
    },
    [userId],
  );

  return {
    invitations,
    isLoading,
    error,
    refresh,
    accept,
    reject,
  };
}
