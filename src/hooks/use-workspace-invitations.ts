"use client";

/**
 * useWorkspaceInvitations Hook
 * Manages workspace invitations for workspace owners/admins
 */

import { useState, useCallback } from "react";
import type { WorkspaceInvitation, InvitableRole } from "@/types/invitation";
import {
  createInvitation,
  getWorkspaceInvitations,
  revokeInvitation,
  hasActiveInvitation,
} from "@/services/invitation-service";

interface UseWorkspaceInvitationsReturn {
  invitations: WorkspaceInvitation[];
  isLoading: boolean;
  error: string | null;
  create: (
    workspaceId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: InvitableRole,
  ) => Promise<WorkspaceInvitation>;
  revoke: (invitationId: string) => Promise<void>;
  checkExisting: (
    workspaceId: string,
    inviteeEmail: string,
  ) => Promise<boolean>;
  refresh: (workspaceId: string) => Promise<void>;
}

export function useWorkspaceInvitations(): UseWorkspaceInvitationsReturn {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (workspaceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const pending = await getWorkspaceInvitations(workspaceId, "pending");
      setInvitations(pending);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load invitations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    async (
      workspaceId: string,
      inviterUserId: string,
      inviteeEmail: string,
      role: InvitableRole,
    ): Promise<WorkspaceInvitation> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check for existing active invitation
        const existing = await hasActiveInvitation(workspaceId, inviteeEmail);
        if (existing) {
          throw new Error("An active invitation already exists for this email");
        }

        const invitation = await createInvitation({
          workspaceId,
          inviterUserId,
          inviteeEmail,
          role,
        });

        await refresh(workspaceId);
        return invitation;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create invitation";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh],
  );

  const revoke = useCallback(async (invitationId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await revokeInvitation(invitationId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke invitation";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkExisting = useCallback(
    async (workspaceId: string, inviteeEmail: string): Promise<boolean> => {
      return hasActiveInvitation(workspaceId, inviteeEmail);
    },
    [],
  );

  return {
    invitations,
    isLoading,
    error,
    create,
    revoke,
    checkExisting,
    refresh,
  };
}
