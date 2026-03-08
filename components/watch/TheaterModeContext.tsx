"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type TheaterModeContextValue = {
  theaterMode: boolean;
  toggleTheaterMode: () => void;
};

const TheaterModeContext = createContext<TheaterModeContextValue | null>(null);

export function TheaterModeProvider({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [theaterMode, setTheaterMode] = useState(false);
  const toggleTheaterMode = useCallback(
    () => setTheaterMode((prev: boolean) => !prev),
    [],
  );

  const containerClass = theaterMode
    ? "theater-mode fixed inset-0 z-50 size-full min-h-dvh w-screen max-w-none overflow-hidden rounded-none bg-black"
    : className;

  return (
    <TheaterModeContext.Provider value={{ theaterMode, toggleTheaterMode }}>
      <div className={containerClass}>{children}</div>
    </TheaterModeContext.Provider>
  );
}

export function useTheaterMode(): TheaterModeContextValue | null {
  return useContext(TheaterModeContext);
}
