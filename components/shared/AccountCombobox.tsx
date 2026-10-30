"use client";

import { useState, useTransition } from "react";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createQuickAccountAction } from "@/app/actions/accounts";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { toast } from "sonner";

export interface ComboboxAccount {
  id: string;
  name: string;
  nameUr?: string | null;
  code: string;
}

export function AccountCombobox({
  accounts,
  value,
  onChange,
  placeholder,
  id,
  allowCreate,
}: {
  accounts: ComboboxAccount[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder: string;
  id?: string;
  /** Lets the user type a name with no match and create that account on the spot — used for the customer field in sale entry so a new buyer never requires leaving the screen. */
  allowCreate?: { type: "VENDOR" | "CUSTOMER" };
}) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [created, setCreated] = useState<ComboboxAccount[]>([]);
  const [creating, startCreating] = useTransition();

  // `created` is this component's optimistic cache of accounts it just made —
  // once the parent revalidates (e.g. a router.refresh() after a save), the
  // same account arrives again in `accounts`, so drop it from `created` to
  // avoid rendering it twice with the same key.
  const allAccounts = created.length ? [...accounts, ...created.filter((c) => !accounts.some((a) => a.id === c.id))] : accounts;
  const selected = allAccounts.find((a) => a.id === value);

  const trimmedQuery = query.trim();
  const hasExactMatch = allAccounts.some((a) => a.name.toLowerCase() === trimmedQuery.toLowerCase());
  const showCreateOption = !!allowCreate && trimmedQuery.length > 0 && !hasExactMatch;

  function handleCreate() {
    if (!allowCreate || !trimmedQuery) return;
    startCreating(async () => {
      const res = await createQuickAccountAction({ type: allowCreate.type, name: trimmedQuery });
      if (res.ok && res.id && res.code) {
        const newAccount: ComboboxAccount = { id: res.id, name: trimmedQuery, code: res.code };
        setCreated((c) => [...c, newAccount]);
        onChange(res.id);
        setOpen(false);
        setQuery("");
        toast.success(`${trimmedQuery} (${res.code})`);
      } else {
        toast.error(res.error ?? t("common.error"));
      }
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${selected.name} (${selected.code})` : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            className="w-full border-b border-border px-3 py-2 text-sm outline-none"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            {!showCreateOption && (
              <Command.Empty className="px-3 py-4 text-center text-sm text-muted-foreground">{t("common.noResults")}</Command.Empty>
            )}
            {allAccounts.map((a) => (
              <Command.Item
                key={a.id}
                value={`${a.name} ${a.code}`}
                onSelect={() => {
                  onChange(a.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-sm data-[selected=true]:bg-muted"
              >
                <Check className={cn("size-3.5", a.id === value ? "opacity-100" : "opacity-0")} />
                <span className="flex-1">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.code}</span>
              </Command.Item>
            ))}
            {showCreateOption && (
              <Command.Item
                value={`__create__${trimmedQuery}`}
                onSelect={handleCreate}
                disabled={creating}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-primary data-[selected=true]:bg-muted"
              >
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                <span>
                  {t("common.add")} &ldquo;{trimmedQuery}&rdquo;
                </span>
              </Command.Item>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
