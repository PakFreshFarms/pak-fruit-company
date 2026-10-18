import { formatDistanceToNow, format } from "date-fns";
import type { Locale } from "./LocaleProvider";

/**
 * date-fns ships no Urdu locale at all, so relative phrasing ("6 months
 * ago") has no correct translation — showing it in English inside an
 * otherwise-Urdu screen reads wrong. Urdu mode shows an absolute date
 * instead; English keeps the familiar relative phrasing.
 */
export function formatWhen(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "ur") return format(d, "dd MMM yyyy");
  return formatDistanceToNow(d, { addSuffix: true });
}
