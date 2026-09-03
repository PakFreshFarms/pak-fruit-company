"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./dictionaries/en.json";
import ur from "./dictionaries/ur.json";

export type Locale = "en" | "ur";

const dictionaries: Record<Locale, Record<string, unknown>> = { en, ur };

const STORAGE_KEY = "mandi-hisab-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "ur") setLocaleState(saved);
    } catch {
      // ignore (private browsing, etc.)
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ur" : "en");
  }, [locale, setLocale]);

  const dir: "ltr" | "rtl" = locale === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.classList.toggle("font-urdu", locale === "ur");
  }, [locale, dir]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const primary = lookup(dictionaries[locale], key);
      const fallback = primary ?? lookup(dictionaries.en, key) ?? key;
      if (!vars) return fallback;
      return Object.entries(vars).reduce(
        (str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, "g"), String(v)),
        fallback,
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, toggleLocale, dir, t }), [locale, setLocale, toggleLocale, dir, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Shorthand for the translation function alone. */
export function useTranslation() {
  const { t } = useLocale();
  return t;
}
