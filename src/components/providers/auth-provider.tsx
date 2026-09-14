"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "@/lib/api-client";
import {
  clearTokens,
  endImpersonationSession,
  getAccessToken,
  isImpersonating,
  setTokens,
  startImpersonationSession,
} from "@/lib/auth-tokens";

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role?: "USER" | "SUPERADMIN";
  isBlocked?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role?: string;
  planSlug?: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  isLoading: boolean;
  impersonating: boolean;
  login: (
    email: string,
    password: string,
    next?: string
  ) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    next?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  addWorkspace: (workspace: WorkspaceInfo) => void;
  refreshWorkspaces: () => Promise<unknown>;
  refreshUser: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  startImpersonation: (data: AuthResponse) => void;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/auth/me");
      setUser(me);
    } catch {
      // token invalid — bootstrap effect handles redirect
    }
  }, []);

  const loadWorkspaces = useCallback(async () => {
    try {
      const list = await apiFetch<WorkspaceInfo[]>("/workspaces");
      setWorkspaces(list);
      setActiveWorkspace((current) => {
        if (current && list.some((ws) => ws.id === current.id)) return current;
        const stored = localStorage.getItem("vocaliq_active_ws");
        const preferred =
          (stored && list.find((ws) => ws.id === stored)) || list[0];
        return preferred ?? null;
      });
      return list;
    } catch {
      setWorkspaces([]);
      setActiveWorkspace(null);
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setImpersonating(isImpersonating());
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiFetch<AuthUser>("/auth/me");
        if (!cancelled) setUser(me);
        if (!cancelled) await loadWorkspaces();
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadWorkspaces]);

  useEffect(() => {
    if (isLoading) return;
    const pathname = window.location.pathname;
    const isUserPortal = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!user && isUserPortal) {
      router.replace("/login");
      return;
    }
    // Admin console ke andar sirf SUPERADMIN — baqi sab wapas
    if (
      user &&
      user.role !== "SUPERADMIN" &&
      pathname.startsWith("/admin") &&
      pathname !== "/admin/login"
    ) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const afterAuthSuccess = useCallback(
    async (data: AuthResponse, loadWs: boolean) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      if (loadWs) {
        await loadWorkspaces();
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
    },
    [loadWorkspaces]
  );

  const login = useCallback(
    async (email: string, password: string, next?: string) => {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      await afterAuthSuccess(data, true);
      router.push(next ?? "/dashboard");
    },
    [afterAuthSuccess, router]
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/admin/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      await afterAuthSuccess(data, false);
      router.push("/admin");
    },
    [afterAuthSuccess, router]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, next?: string) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password },
        skipAuth: true,
      });
      await afterAuthSuccess(data, true);
      router.push(next ?? "/onboarding/create-workspace");
    },
    [afterAuthSuccess, router]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // token already invalid — ignore
    }
    clearTokens();
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    setImpersonating(false);
    router.push("/login");
  }, [router]);

  const addWorkspace = useCallback((workspace: WorkspaceInfo) => {
    setWorkspaces((prev) => [workspace, ...prev]);
    setActiveWorkspace(workspace);
  }, []);

  const switchWorkspace = useCallback((workspaceId: string) => {
    localStorage.setItem("vocaliq_active_ws", workspaceId);
    setActiveWorkspace((prev) =>
      prev?.id === workspaceId ? prev : null
    );
    setWorkspaces((list) => {
      const target = list.find((ws) => ws.id === workspaceId) ?? null;
      setActiveWorkspace(target);
      return list;
    });
  }, []);

  const startImpersonation = useCallback(
    (data: AuthResponse) => {
      startImpersonationSession(data.accessToken, data.refreshToken);
      setImpersonating(true);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router]
  );

  const exitImpersonation = useCallback(() => {
    const restored = endImpersonationSession();
    setImpersonating(false);
    if (restored) {
      void refreshUser().then(() => router.push("/admin"));
    } else {
      clearTokens();
      setUser(null);
      router.push("/admin/login");
    }
  }, [refreshUser, router]);

  const value = useMemo(
    () => ({
      user,
      workspaces,
      activeWorkspace,
      isLoading,
      impersonating,
      login,
      adminLogin,
      register,
      logout,
      addWorkspace,
      refreshWorkspaces: loadWorkspaces,
      refreshUser,
      switchWorkspace,
      startImpersonation,
      exitImpersonation,
    }),
    [
      user,
      workspaces,
      activeWorkspace,
      isLoading,
      impersonating,
      login,
      adminLogin,
      register,
      logout,
      addWorkspace,
      loadWorkspaces,
      refreshUser,
      switchWorkspace,
      startImpersonation,
      exitImpersonation,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
