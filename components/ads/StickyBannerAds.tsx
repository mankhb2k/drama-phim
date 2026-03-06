"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const STICKY_SCRIPT_SRC =
  "//simplisticpride.com/bkXiV.shdrGslm0jYQWHcA/Veym/9UuFZ/UOlxkzP/TuYl4xN_DKUa2pMAT_M/tgNtjUg/0fNrTbY/x/NYwY";

const STORAGE_KEY = "sticky-banner-closed";

export function StickyBanner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setIsHidden(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    const s = document.createElement("script");
    (s as HTMLScriptElement & { settings?: object }).settings = {};
    s.src = STICKY_SCRIPT_SRC;
    s.async = true;
    s.referrerPolicy = "no-referrer-when-downgrade";
    container.appendChild(s);

    return () => {
      s.remove();
    };
  }, [mounted]);

  const handleClose = () => {
    setIsHidden(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  };

  if (isHidden) return null;

  return (
    <div
      id="sticky-banner-wrapper"
      className="fixed bottom-0 left-0 right-0 z-50 w-full bg-background/95 shadow-[0_-0.25rem_0.75rem_rgba(0,0,0,0.15)]"
    >
      <div
        ref={containerRef}
        className="relative flex min-h-[3.75rem] w-full items-center justify-center overflow-hidden py-2"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng banner"
          className="absolute right-2 top-1/2 z-[60] flex size-8 -translate-y-1/2 items-center justify-center rounded bg-black/70 text-white transition-colors hover:bg-black/90"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
