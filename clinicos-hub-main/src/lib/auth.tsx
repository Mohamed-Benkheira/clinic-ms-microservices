import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./types";
import { loginRequest, logoutRequest, getMeRequest } from "./api/auth.api";
import { clearToken, getToken } from "./api/client";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  refresh: string;
}

interface AuthCtx {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "clinicos.user";
const REFRESH_KEY = "clinicos.refresh";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session: if token exists verify with /me/
  useEffect(() => {
    const restore = async () => {
      try {
        const token = getToken();
        if (!token) return;
        // Try to get fresh user data from server
        const me = await getMeRequest();
        const refresh = sessionStorage.getItem(REFRESH_KEY) ?? "";
        const u: AuthUser = { ...me, refresh };
        setUser(u);
      } catch {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const u = await loginRequest({ email, password });
    const authUser: AuthUser = u;
    setUser(authUser);
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(authUser));
      sessionStorage.setItem(REFRESH_KEY, u.refresh);
    } catch {
      /* sandboxed */
    }
  };

  const logout = async () => {
    const refresh = user?.refresh ?? sessionStorage.getItem(REFRESH_KEY) ?? "";
    await logoutRequest(refresh);
    setUser(null);
    try {
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      /* sandboxed */
    }
  };

  return <Ctx.Provider value={{ user, isLoading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
