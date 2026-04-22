"use client";

/**
 * Admin Panel Page
 * Platform administration for managing users and labels
 * Only accessible to users with the 'admin' platform label
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/appwrite/auth";
import { isPlatformAdmin } from "@/types/platform";
import {
  listAllUsers,
  promoteToAdmin,
  demoteFromAdmin,
  PlatformUser,
} from "@/services/platform-admin-service";
import { showSuccess, showError } from "@/lib/toast";
import { Navbar } from "@/components/layout/navbar";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!mountedRef.current) return;

        if (!user) {
          router.push("/login");
          return;
        }

        if (!isPlatformAdmin(user)) {
          router.push("/workspace");
          return;
        }

        setIsAuthorized(true);
        await loadUsers();
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mountedRef.current) {
          router.push("/workspace");
        }
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const result = await listAllUsers({
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      if (mountedRef.current) {
        setUsers(result.users);
        setTotalUsers(result.total);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      if (mountedRef.current) {
        showError("Failed to load users");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1);
      loadUsers();
    },
    [search, page],
  );

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      setIsUpdating(userId);
      await promoteToAdmin(userId);
      if (mountedRef.current) {
        showSuccess("User promoted to admin");
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to promote user:", error);
      if (mountedRef.current) {
        showError("Failed to promote user");
      }
    } finally {
      if (mountedRef.current) {
        setIsUpdating(null);
      }
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      setIsUpdating(userId);
      await demoteFromAdmin(userId);
      if (mountedRef.current) {
        showSuccess("User demoted to user");
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to demote user:", error);
      if (mountedRef.current) {
        showError("Failed to demote user");
      }
    } finally {
      if (mountedRef.current) {
        setIsUpdating(null);
      }
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalUsers);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100dvh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400">
              Manage platform users and permissions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400 text-sm">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Admins</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter((u) => u.labels?.includes("admin")).length}
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-sm">Regular Users</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter((u) => !u.labels?.includes("admin")).length}
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form
              onSubmit={handleSearch}
              className="flex gap-3 w-full md:w-auto"
            >
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
            <button
              onClick={() => loadUsers()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Role
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.$id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-white font-medium">
                            {user.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.emailVerification
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {user.emailVerification ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.labels?.includes("admin")
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {user.labels?.includes("admin") ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Admin
                            </>
                          ) : (
                            <>
                              <Users className="w-3.5 h-3.5" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.labels?.includes("admin") ? (
                            <button
                              onClick={() => handleDemoteFromAdmin(user.$id)}
                              disabled={isUpdating === user.$id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Remove admin privileges"
                            >
                              {isUpdating === user.$id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShieldOff className="w-4 h-4" />
                              )}
                              <span className="text-sm">Remove Admin</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromoteToAdmin(user.$id)}
                              disabled={isUpdating === user.$id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Grant admin privileges"
                            >
                              {isUpdating === user.$id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                              <span className="text-sm">Make Admin</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Showing {startIndex} to {endIndex} of {totalUsers} users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
