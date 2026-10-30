"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Truck, Wallet, HandCoins, Users, ShoppingCart, Sprout, BarChart3, BookOpen, Settings, type LucideIcon } from "lucide-react";

interface Tile {
  href: string;
  icon: LucideIcon;
  key: string;
  color: string;
}

const TILES: Tile[] = [
  { href: "/bilti", icon: Truck, key: "nav.bilti", color: "#15803d" },
  { href: "/cash-book", icon: Wallet, key: "nav.cashBook", color: "#2563eb" },
  { href: "/wasooli", icon: HandCoins, key: "nav.wasooli", color: "#d97706" },
  { href: "/vendors", icon: Users, key: "nav.vendors", color: "#9333ea" },
  { href: "/customers", icon: ShoppingCart, key: "nav.customers", color: "#0d9488" },
  { href: "/farms", icon: Sprout, key: "nav.farms", color: "#65a30d" },
  { href: "/reports", icon: BarChart3, key: "nav.reports", color: "#dc2626" },
  { href: "/accounts", icon: BookOpen, key: "nav.accounts", color: "#c2410c" },
  { href: "/settings", icon: Settings, key: "nav.settings", color: "#475569" },
];

export function HomeView({ shopName, userName }: { shopName: string; userName: string }) {
  const t = useTranslation();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{shopName}</h1>
        <p className="text-lg text-muted-foreground">{t("home.greeting", { name: userName })}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {TILES.map(({ href, icon: Icon, key, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center shadow-sm transition-transform hover:scale-[1.03] hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: color }}
          >
            <Icon className="size-14 text-white" strokeWidth={1.75} />
            <span className="text-xl font-bold text-white">{t(key)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
