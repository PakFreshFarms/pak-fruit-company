"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SlashFocus } from "@/components/layout/SlashFocus";
import type { SessionUser } from "@/lib/auth/session";

export function AppShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <SlashFocus />
    </div>
  );
}
