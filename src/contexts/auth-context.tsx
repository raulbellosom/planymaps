"use client";

/**
 * Auth Context
 * Single source of truth for authentication state.
 * Ensures getCurrentUser() is called exactly once on mount regardless of
 * how many components consume useAuth().
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login as loginService,
  register as registerService,
  logout as logoutService,
  requestPasswordReset as requestResetService,
  completePasswordReset as completeResetService,
  createEmailVerification,
  verifyEmailSecret,
  updateUserPreferences,
} from "@/lib/appwrite/auth";

interface User {
  $id: string;
  name?: string;
  email: string;
  prefs: Record<string, unknown>;
  emailVerification?: boolean;
  labels?: string[];
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    userId: string,
    secret: string,
    password: string,
  ) => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const mountedRef = useRef(true);

  // Single effect — fires once per app lifetime, not once per consumer
  useEffect(() => {
    mountedRef.current = true;

    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mountedRef.current) {
          setUser(currentUser as User | null);
        }
      } catch {
        if (mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (mountedRef.current) {
        setUser(currentUser as User | null);
      }
    } catch {
      if (mountedRef.current) {
        setUser(null);
      }
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await loginService(email, password);
        await refreshUser();
        router.push("/workspace");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [router, refreshUser],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await registerService(email, password, name);
        await refreshUser();
        await createEmailVerification();
        router.push("/login?registered=true");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [router, refreshUser],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutService();
      if (mountedRef.current) {
        setUser(null);
      }
      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [router]);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await requestResetService(email);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Password reset request failed";
      setError(message);
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const resetPassword = useCallback(
    async (userId: string, secret: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await completeResetService(userId, secret, password);
        router.push("/login?reset=true");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Password reset failed";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  const verifyEmail = useCallback(
    async (userId: string, secret: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await verifyEmailSecret(userId, secret);
        await refreshUser();
        router.push("/login?verified=true");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Email verification failed";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [router, refreshUser],
  );

  const resendVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await createEmailVerification();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend verification";
      setError(message);
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateProfile = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await updateUserPreferences({ name });
        await refreshUser();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [refreshUser],
  );

  const changePassword = useCallback(
    async (_oldPassword: string, _newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        throw new Error(
          "Please use the password reset feature to change your password",
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to change password";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await updateUserPreferences({ avatarUrl });
        await refreshUser();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update avatar";
        setError(message);
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [refreshUser],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        changePassword,
        updateAvatar,
        refreshUser,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
