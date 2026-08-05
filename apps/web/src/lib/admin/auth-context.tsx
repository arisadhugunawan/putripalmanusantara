"use client";

import type { AdminProfile } from "@ppn/shared-types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "./client";

interface AuthContextValue {
  admin: AdminProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const result = await adminApi.get<{ admin: AdminProfile }>("/admin/auth/me");
      setAdmin(result.admin);
      setStatus("authenticated");
    } catch {
      setAdmin(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await adminApi.post<{ admin: AdminProfile }>("/admin/auth/login", {
        email,
        password,
      });
      setAdmin(result.admin);
      setStatus("authenticated");
      router.push("/admin");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.post("/admin/auth/logout");
    } catch {
      // Best-effort — clear local state and redirect regardless.
    }
    setAdmin(null);
    setStatus("unauthenticated");
    router.push("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ admin, status, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiRequestError };
