"use client";

/**
 * Workspace Context
 * Manages workspace state and provides workspace operations
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type {
  Workspace,
  WorkspaceRole,
  PermissionCheck,
} from "@/types/workspace";
import { getWorkspacePermissions } from "@/types/workspace";
import {
  createWorkspace,
  listUserWorkspaces,
  getMemberRole,
  addWorkspaceMember,
} from "@/services/workspace-service";
import { getCurrentUser } from "@/lib/appwrite/auth";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToUserMemberships } from "@/lib/realtime/realtime-service";

interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  userRole: WorkspaceRole | null;
  permissions: PermissionCheck;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createNewWorkspace: (name: string, slug: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.$id ?? null;
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep a stable ref so realtime callbacks always see the latest currentWorkspace
  // without the subscription needing to re-subscribe on every change.
  const currentWorkspaceRef = useRef<Workspace | null>(null);
  useEffect(() => {
    currentWorkspaceRef.current = currentWorkspace;
  });

  const permissions = userRole
    ? getWorkspacePermissions(userRole)
    : {
        canView: false,
        canEdit: false,
        canAdmin: false,
        isOwner: false,
      };

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setWorkspaces([]);
        return;
      }
      const userWorkspaces = await listUserWorkspaces(user.$id);
      setWorkspaces(userWorkspaces);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load workspaces",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Membership realtime subscription ─────────────────────────────────────
  // React to membership creates (invitation accepted) and deletes (removed
  // from workspace) so the workspace list stays fresh without a page reload.
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserMemberships(userId, {
      onCreated: () => {
        // Joined a new workspace — refresh the list
        refreshWorkspaces();
      },
      onDeleted: (membership) => {
        // Removed from a workspace — refresh the list and clear current if needed
        refreshWorkspaces();
        if (currentWorkspaceRef.current?.$id === membership.workspaceId) {
          setCurrentWorkspace(null);
          setUserRole(null);
        }
      },
    });

    return () => unsubscribe();
  }, [userId, refreshWorkspaces]);

  // ─────────────────────────────────────────────────────────────────────────

  const createNewWorkspace = useCallback(
    async (name: string, slug: string): Promise<Workspace> => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Not authenticated");
        }
        // Create the workspace
        const workspace = await createWorkspace(name, slug, user.$id);
        // Add creator as owner member
        await addWorkspaceMember(workspace.$id, user.$id, "owner");
        // Refresh workspaces list
        await refreshWorkspaces();
        // Set as current workspace
        setCurrentWorkspace(workspace);
        setUserRole("owner");
        return workspace;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create workspace";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshWorkspaces],
  );

  const handleSetCurrentWorkspace = useCallback(
    async (workspace: Workspace | null) => {
      setCurrentWorkspace(workspace);
      if (!workspace) {
        setUserRole(null);
        return;
      }
      // Fetch the user's role for this workspace
      try {
        const user = await getCurrentUser();
        if (user) {
          const role = await getMemberRole(workspace.$id, user.$id);
          setUserRole(role);
        }
      } catch {
        setUserRole(null);
      }
    },
    [],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        userRole,
        permissions,
        isLoading,
        error,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        refreshWorkspaces,
        createNewWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
