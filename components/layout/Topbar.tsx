"use client";

import { Languages, Moon, Sun, SunMoon, Search, Check, LogOut, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useTheme, ACCENT_COLORS, type AccentColor } from "@/lib/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth/session";

const ACCENT_SWATCH: Record<AccentColor, string> = {
  rust: "#a8461f",
  green: "#2f6b3f",
  blue: "#1f5c8b",
  purple: "#6b3fa0",
  amber: "#a3720a",
  teal: "#166e6e",
};

const ACCENT_LABEL_KEY: Record<AccentColor, string> = {
  rust: "common.accentRust",
  green: "common.accentGreen",
  blue: "common.accentBlue",
  purple: "common.accentPurple",
  amber: "common.accentAmber",
  teal: "common.accentTeal",
};

const SECTION_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  bilti: "nav.bilti",
  vendors: "nav.vendors",
  customers: "nav.customers",
  "cash-book": "nav.cashBook",
  wasooli: "nav.wasooli",
  farms: "nav.farms",
  accounts: "nav.accounts",
  reports: "nav.reports",
  settings: "nav.settings",
};

export function Topbar({ onOpenPalette, user }: { onOpenPalette?: () => void; user: SessionUser }) {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme, resolvedTheme, accent, setAccent } = useTheme();
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean)[0] ?? "";
  const title = t(SECTION_KEYS[section] ?? "app.name");

  return (
    <header className="no-print flex h-20 shrink-0 items-center justify-between border-b-2 border-border bg-card px-6 py-3">
      <div className="text-xl font-bold">{title}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenPalette} className="text-muted-foreground">
          <Search className="size-3.5" />
          <span className="hidden sm:inline">{t("common.commandPaletteHint")}</span>
        </Button>

        <div className="flex items-center rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setLocale("en")}
            className={`px-2.5 py-1.5 text-xs font-medium ${locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("ur")}
            className={`px-2.5 py-1.5 text-xs font-medium ${locale === "ur" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ fontFamily: "var(--font-nastaliq)" }}
          >
            اردو
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("common.theme")}>
              {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="size-4" /> {t("common.light")} {theme === "light" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="size-4" /> {t("common.dark")} {theme === "dark" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <SunMoon className="size-4" /> {t("common.system")} {theme === "system" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("common.colorTheme")}</DropdownMenuLabel>
            <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  title={t(ACCENT_LABEL_KEY[c])}
                  aria-label={t(ACCENT_LABEL_KEY[c])}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                    accent === c && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: ACCENT_SWATCH[c] }}
                >
                  {accent === c && <Check className="size-3.5 text-white" />}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Languages className="size-4" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <UserIcon className="size-3.5" />
              <span className="hidden sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user.name} · {user.role === "OWNER" ? t("auth.owner") : t("auth.munshi")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { void logoutAction(); }}>
              <LogOut className="size-4" /> {t("auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
