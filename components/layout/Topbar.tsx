"use client";

import { Languages, Moon, Sun, SunMoon, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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

export function Topbar({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean)[0] ?? "";
  const title = t(SECTION_KEYS[section] ?? "app.name");

  return (
    <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-semibold">{title}</div>
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
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Languages className="size-4" />
        </div>
      </div>
    </header>
  );
}
