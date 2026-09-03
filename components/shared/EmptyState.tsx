import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, instruction }: { icon?: LucideIcon; title: string; instruction: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      {Icon && <Icon className="size-8 text-muted-foreground" />}
      <div className="text-sm font-medium">{title}</div>
      <div className="max-w-sm text-sm text-muted-foreground">{instruction}</div>
    </div>
  );
}
