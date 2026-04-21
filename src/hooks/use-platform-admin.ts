"use client";

/**
 * usePlatformAdmin Hook
 * Provides platform-level admin capabilities
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import {
  listAllUsers,
  getUserById,
  promoteToAdmin,
  demoteFromAdmin,
  isUserAdmin,
  getUserCount,
  updateUserStatus,
  deleteUser,
  PlatformUser,
} from "@/services/platform-admin-service";
import { showSuccess, showError } from "@/lib/toast";

interface UsePlatformAdminReturn {
  // State
  isAdmin: boolean;
  isLoading: boolean;
  users: PlatformUser[];
  totalUsers: number;
  error: string | null;

  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;

  // Actions
  refreshUsers: () => Promise<void>;
  promoteUser: (userId: string) => Promise<void>;
  demoteUser: (userId: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  checkIsAdmin: () => Promise<boolean>;
}

export function usePlatformAdmin(): UsePlatformAdminReturn {
  const { user, isLoading: authLoading } = useAuth();
  const mountedRef = useRef(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we're currently performing an action
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // Set up mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if current user is admin
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const admin = await isUserAdmin(user.$id);
      if (mountedRef.current) {
        setIsAdmin(admin);
        setIsCheckingAdmin(false);
      }
      return admin;
    } catch (err) {
      console.error("Failed to check admin status:", err);
      if (mountedRef.current) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
      }
      return false;
    }
  }, [user]);

  // Check admin status when user changes
  useEffect(() => {
    if (!authLoading) {
      checkIsAdmin();
    }
  }, [authLoading, checkIsAdmin]);

  // Load users
  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setIsLoadingUsers(true);
      setError(null);

      const result = await listAllUsers({
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      if (mountedRef.current) {
        setUsers(result.users);
        setTotalUsers(result.total);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      if (mountedRef.current) {
        setError("Failed to load users");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingUsers(false);
      }
    }
  }, [isAdmin, search, page, pageSize]);

  // Load users when admin status or pagination changes
  useEffect(() => {
    if (isAdmin && !isCheckingAdmin) {
      refreshUsers();
    }
  }, [isAdmin, isCheckingAdmin, refreshUsers]);

  // Reset to page 1 when search changes
  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  // Promote user to admin
  const promoteUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setActionUserId(userId);
        await promoteToAdmin(userId);
        if (mountedRef.current) {
          showSuccess("User promoted", "User has been promoted to admin");
          await refreshUsers();
        }
      } catch (err) {
        console.error("Failed to promote user:", err);
        if (mountedRef.current) {
          showError("Promotion failed", "Failed to promote user to admin");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setActionUserId(null);
        }
      }
    },
    [refreshUsers],
  );

  // Demote user from admin
  const demoteUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setActionUserId(userId);
        await demoteFromAdmin(userId);
        if (mountedRef.current) {
          showSuccess("User demoted", "User has been demoted to regular user");
          await refreshUsers();
        }
      } catch (err) {
        console.error("Failed to demote user:", err);
        if (mountedRef.current) {
          showError("Demotion failed", "Failed to demote user from admin");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setActionUserId(null);
        }
      }
    },
    [refreshUsers],
  );

  // Deactivate user account
  const deactivateUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setActionUserId(userId);
        await updateUserStatus(userId, false);
        if (mountedRef.current) {
          showSuccess("User deactivated", "User account has been deactivated");
          await refreshUsers();
        }
      } catch (err) {
        console.error("Failed to deactivate user:", err);
        if (mountedRef.current) {
          showError("Deactivation failed", "Failed to deactivate user account");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setActionUserId(null);
        }
      }
    },
    [refreshUsers],
  );

  // Activate user account
  const activateUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setActionUserId(userId);
        await updateUserStatus(userId, true);
        if (mountedRef.current) {
          showSuccess("User activated", "User account has been activated");
          await refreshUsers();
        }
      } catch (err) {
        console.error("Failed to activate user:", err);
        if (mountedRef.current) {
          showError("Activation failed", "Failed to activate user account");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setActionUserId(null);
        }
      }
    },
    [refreshUsers],
  );

  // Delete user account
  const removeUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setActionUserId(userId);
        await deleteUser(userId);
        if (mountedRef.current) {
          showSuccess("User removed", "User account has been deleted");
          await refreshUsers();
        }
      } catch (err) {
        console.error("Failed to remove user:", err);
        if (mountedRef.current) {
          showError("Removal failed", "Failed to delete user account");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setActionUserId(null);
        }
      }
    },
    [refreshUsers],
  );

  return {
    // State
    isAdmin,
    isLoading: authLoading || isCheckingAdmin || isLoadingUsers,
    users,
    totalUsers,
    error,

    // Pagination
    page,
    pageSize,
    setPage,
    search,
    setSearch: handleSetSearch,

    // Actions
    refreshUsers,
    promoteUser,
    demoteUser,
    deactivateUser,
    activateUser,
    removeUser,
    checkIsAdmin,
  };
}
