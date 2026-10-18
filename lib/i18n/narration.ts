import type { useTranslation } from "./LocaleProvider";

export interface NarrationSource {
  narration: string;
  narrationKey?: string | null;
  narrationParams?: Record<string, string | number> | null;
}

/**
 * Renders a journal entry's narration in whichever language is active. When
 * narrationKey is set, the ledger reads correctly after a language switch —
 * even for entries posted while the other language was active — because the
 * event type and its parameters were stored structured, not as baked text.
 * Falls back to the stored `narration` (always English) for older entries
 * posted before this existed, and for free-text/MANUAL entries where the
 * stored text is exactly what the operator typed.
 */
export function renderNarration(t: ReturnType<typeof useTranslation>, row: NarrationSource): string {
  if (!row.narrationKey) return row.narration;

  const params = { ...(row.narrationParams ?? {}) };

  // Farm expense heads come from a fixed list (Mazdoori, Spray, ...) and are
  // translated as their own dictionary lookup before being substituted into
  // the narration template, since the template substitution itself is a
  // flat string replace with no nested key resolution.
  if (row.narrationKey === "narration.farmExpense" && typeof params.head === "string") {
    params.head = t(`farmHead.${params.head}`);
  }

  return t(row.narrationKey, params);
}
