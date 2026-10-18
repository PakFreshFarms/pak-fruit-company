"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { searchEverything, type SearchResult } from "@/app/actions/search";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Truck, Users, ShoppingCart, Sprout, ScrollText } from "lucide-react";

const ICONS = { vendor: Users, customer: ShoppingCart, bilti: Truck, farm: Sprout, voucher: ScrollText };

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslation();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchEverything(query));
      });
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh]" onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <Command shouldFilter={false}>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={t("common.searchPlaceholder")}
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {query && results.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">{t("common.noResults")}</div>
            )}
            {results.map((r) => {
              const Icon = ICONS[r.type];
              return (
                <Command.Item
                  key={`${r.type}-${r.id}`}
                  onSelect={() => {
                    onOpenChange(false);
                    router.push(r.href);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{r.title}</span>
                  {r.subtitle && <span className="text-xs text-muted-foreground">{r.subtitle}</span>}
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
