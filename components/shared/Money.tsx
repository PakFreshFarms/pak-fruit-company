import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Right-aligned, tabular-numeral money display. Negative in red with a leading minus, never brackets (spec section 8). */
export function Money({ paisa, className }: { paisa: number; className?: string }) {
  return <span className={cn("tabular-nums", paisa < 0 ? "text-danger" : "", className)}>{formatPKR(paisa)}</span>;
}
