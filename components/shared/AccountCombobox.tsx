"use client";

import { useState } from "react";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}: {
  accounts: ComboboxAccount[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${selected.name} (${selected.code})` : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <Command.Input autoFocus placeholder={placeholder} className="w-full border-b border-border px-3 py-2 text-sm outline-none" />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-4 text-center text-sm text-muted-foreground">No results — try inline create.</Command.Empty>
            {accounts.map((a) => (
              <Command.Item
                key={a.id}
                value={`${a.name} ${a.code}`}
                onSelect={() => {
                  onChange(a.id);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-sm data-[selected=true]:bg-muted"
              >
                <Check className={cn("size-3.5", a.id === value ? "opacity-100" : "opacity-0")} />
                <span className="flex-1">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.code}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
