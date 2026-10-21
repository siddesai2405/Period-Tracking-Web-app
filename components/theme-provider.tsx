"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AccentTheme } from "@/lib/store";

export type Mode = "light" | "dark";

interface ThemeCtx {
  mode: Mode;
  accent: AccentTheme;
  toggle: () => void;
  setMode: (m: Mode) => void;
  setAccent: (a: AccentTheme) => void;
  // legacy compat
  theme: Mode;
  set: (m: Mode) => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: "light",
  accent: "rose",
  toggle: () => {},
  setMode: () => {},
  setAccent: () => {},
  theme: "light",
  set: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [accent, setAccentState] = useState<AccentTheme>("rose");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted preferences
    const savedMode = (localStorage.getItem("bloom-mode") as Mode) ?? "light";
    const savedAccent = (localStorage.getItem("bloom-accent") as AccentTheme) ?? "rose";
    setModeState(savedMode);
    setAccentState(savedAccent);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(savedMode);
    root.setAttribute("data-accent", savedAccent);
    setMounted(true);
  }, []);

  const applyMode = useCallback((m: Mode) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(m);
    localStorage.setItem("bloom-mode", m);
    setModeState(m);
  }, []);

  const applyAccent = useCallback((a: AccentTheme) => {
    document.documentElement.setAttribute("data-accent", a);
    localStorage.setItem("bloom-accent", a);
    setAccentState(a);
  }, []);

  const toggle = useCallback(() => {
    applyMode(mode === "dark" ? "light" : "dark");
  }, [mode, applyMode]);

  // Avoid flash of unstyled content — render nothing until mounted
  if (!mounted) return null;

  return (
    <Ctx.Provider
      value={{
        mode,
        accent,
        toggle,
        setMode: applyMode,
        setAccent: applyAccent,
        theme: mode,
        set: applyMode,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
