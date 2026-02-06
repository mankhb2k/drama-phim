"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import type { AuthUser } from "@/stores/auth";

/** Gọi GET /api/auth/me khi mount và cập nhật auth store. */
export function AuthHydrate() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { user: AuthUser | null }) => {
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null));
  }, [setUser]);

  return null;
}
