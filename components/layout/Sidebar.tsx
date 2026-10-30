"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutDashboard,
  Truck,
  Users,
  ShoppingCart,
  Wallet,
  HandCoins,
  Sprout,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/home", icon: Home, key: "nav.home" },
  { href: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { href: "/bilti", icon: Truck, key: "nav.bilti" },
  { href: "/vendors", icon: Users, key: "nav.vendors" },
  { href: "/customers", icon: ShoppingCart, key: "nav.customers" },
  { href: "/cash-book", icon: Wallet, key: "nav.cashBook" },
  { href: "/wasooli", icon: HandCoins, key: "nav.wasooli" },
  { href: "/farms", icon: Sprout, key: "nav.farms" },
  { href: "/accounts", icon: BookOpen, key: "nav.accounts" },
  { href: "/reports", icon: BarChart3, key: "nav.reports" },
  { href: "/settings", icon: Settings, key: "nav.settings" },
];

export function Sidebar() {
  const t = useTranslation();
  const pathname = usePathname();

  return (
    <aside className="no-print flex h-screen w-64 shrink-0 flex-col border-r-2 border-border bg-card">
      <Link href="/home" className="flex items-center gap-3 border-b-2 border-border px-4 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">م</div>
        <div className="leading-tight">
          <div className="text-base font-bold">{t("app.name")}</div>
          <div className="text-sm text-muted-foreground">{t("app.tagline")}</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "mx-2 my-1 flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
