"use client";

import { useMemo, useState, useCallback } from "react";
import type { PlatformUser } from "@/types/user";

const USER_KEY = "adyapan-user";
const TOKEN_KEY = "adyapan-token";

export function useAuth() {
  const [user, setUser] = useState<PlatformUser | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as PlatformUser;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      logout,
    }),
    [user, logout],
  );
}
