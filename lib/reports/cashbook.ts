import { prisma } from "@/lib/db/prisma";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export interface CashDayLine {
  id: string;
  date: Date;
  narration: string;
  narrationKey: string | null;
  narrationParams: Record<string, string | number> | null;
  refType: string;
  debit: number;
  credit: number;
  contraName: string | null;
  mode: string | null;
}

/**
 * Everything that actually moved Cash in Hand that day — cash book entries,
 * wasooli recoveries, and farm cash movements alike — so opening + the
 * day's lines always reconciles to the closing balance shown, whichever
 * screen it's opened from (rule 4.8: both books post to the same journal).
 */
export async function getCashInHandDayLines(date: Date): Promise<CashDayLine[]> {
  const cashId = await getSystemAccountId("CASH_IN_HAND");
  const lines = await prisma.journalLine.findMany({
    where: { accountId: cashId, entry: { isReversed: false, date: { gte: startOfDay(date), lte: endOfDay(date) } } },
    include: { entry: true },
    orderBy: { entry: { createdAt: "asc" } },
  });

  const cashEntries = await prisma.cashEntry.findMany({
    where: { journalEntryId: { in: lines.map((l) => l.entryId) } },
    include: { account: true },
  });
  const cashEntryByJournal = new Map(cashEntries.map((c) => [c.journalEntryId, c]));

  return lines.map((l) => {
    const ce = cashEntryByJournal.get(l.entryId);
    return {
      id: l.id,
      date: l.entry.date,
      narration: l.entry.narration,
      narrationKey: l.entry.narrationKey,
      narrationParams: l.entry.narrationParams ? JSON.parse(l.entry.narrationParams) : null,
      refType: l.entry.refType,
      debit: l.debit,
      credit: l.credit,
      contraName: ce?.account.name ?? null,
      mode: ce?.mode ?? null,
    };
  });
}

export async function getCashInHandOpeningBalance(date: Date): Promise<number> {
  const cashId = await getSystemAccountId("CASH_IN_HAND");
  const agg = await prisma.journalLine.aggregate({
    where: { accountId: cashId, entry: { isReversed: false, date: { lt: startOfDay(date) } } },
    _sum: { debit: true, credit: true },
  });
  return (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);
}

export async function getCashInHandMonthSummary(monthDate: Date) {
  const cashId = await getSystemAccountId("CASH_IN_HAND");
  const agg = await prisma.journalLine.aggregate({
    where: {
      accountId: cashId,
      entry: { isReversed: false, date: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) } },
    },
    _sum: { debit: true, credit: true },
  });
  const opening = await getCashInHandOpeningBalance(startOfMonth(monthDate));
  const totalIn = agg._sum.debit ?? 0;
  const totalOut = agg._sum.credit ?? 0;
  return { opening, totalIn, totalOut, closing: opening + totalIn - totalOut };
}

export async function getWasooliEntries(date?: Date) {
  return prisma.cashEntry.findMany({
    where: { book: "WASOOLI", ...(date ? { date: { gte: startOfDay(date), lte: endOfDay(date) } } : {}) },
    include: { account: true },
    orderBy: { date: "desc" },
  });
}
