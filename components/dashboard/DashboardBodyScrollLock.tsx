"use client";

import { useEffect } from "react";

/** Khóa scroll body khi vào dashboard để chỉ content trong main cuộn. */
export function DashboardBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return null;
}
