"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "mandi-hisab-theme";
const ACCENT_STORAGE_KEY = "mandi-hisab-accent";

export const ACCENT_COLORS = ["rust", "green", "blue", "purple", "amber", "teal"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  accent: AccentColor;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [accent, setAccentState] = useState<AccentColor>("rust");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved) setThemeState(saved);
      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null;
      if (savedAccent && ACCENT_COLORS.includes(savedAccent)) setAccentState(savedAccent);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const effective = theme === "system" ? (mql.matches ? "dark" : "light") : theme;
      setResolved(effective);
      document.documentElement.classList.toggle("dark", effective === "dark");
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, a);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme: resolved, setTheme, accent, setAccent }),
    [theme, resolved, setTheme, accent, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
