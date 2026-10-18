import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type Tx = Prisma.TransactionClient;

export interface JournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  farmId?: string | null;
  vendorTagId?: string | null;
  narration?: string | null;
}

export interface PostJournalInput {
  date: Date;
  refType: string;
  refId?: string | null;
  narration: string;
  /** i18n key under "narration.*"; when set, UIs render t(narrationKey, narrationParams) instead of the raw `narration` string, so the ledger reads correctly in whichever language is active. Omit for free-text/MANUAL entries where `narration` is exactly what the user typed. */
  narrationKey?: string | null;
  narrationParams?: Record<string, string | number> | null;
  createdBy: string;
  lines: JournalLineInput[];
}

export class UnbalancedJournalError extends Error {
  constructor(debit: number, credit: number) {
    super(`Journal entry does not balance: debit=${debit} credit=${credit}`);
    this.name = "UnbalancedJournalError";
  }
}

/**
 * Posts one balanced double-entry journal entry. Every financial event in the
 * application must go through this function — nothing writes to a ledger directly.
 * Pass `client` (a $transaction callback client) to include this posting inside
 * a larger atomic write (e.g. creating a Sale row and its journal entry together).
 */
export async function postJournal(input: PostJournalInput, client: Tx | typeof prisma = prisma) {
  const totalDebit = input.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  if (totalDebit !== totalCredit) {
    throw new UnbalancedJournalError(totalDebit, totalCredit);
  }
  if (totalDebit === 0) {
    throw new Error("Journal entry has zero value");
  }
  for (const line of input.lines) {
    if ((line.debit ?? 0) < 0 || (line.credit ?? 0) < 0) {
      throw new Error("Journal line amounts cannot be negative");
    }
    if ((line.debit ?? 0) > 0 && (line.credit ?? 0) > 0) {
      throw new Error("A journal line cannot carry both a debit and a credit");
    }
  }

  return client.journalEntry.create({
    data: {
      date: input.date,
      refType: input.refType,
      refId: input.refId ?? null,
      narration: input.narration,
      narrationKey: input.narrationKey ?? null,
      narrationParams: input.narrationParams ? JSON.stringify(input.narrationParams) : null,
      createdBy: input.createdBy,
      lines: {
        create: input.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit ?? 0,
          credit: l.credit ?? 0,
          farmId: l.farmId ?? null,
          vendorTagId: l.vendorTagId ?? null,
          narration: l.narration ?? null,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Posted entries are never edited or deleted. To correct one, reverse it: this
 * creates a new balanced entry with every debit/credit flipped, links it back
 * via reversalOf, and flags the original isReversed so ledgers can exclude or
 * annotate it.
 */
export async function reverseJournal(
  entryId: string,
  opts: { narration: string; createdBy: string; date?: Date; narrationKey?: string | null; narrationParams?: Record<string, string | number> | null },
  client: Tx | typeof prisma = prisma,
) {
  const original = await client.journalEntry.findUniqueOrThrow({
    where: { id: entryId },
    include: { lines: true },
  });
  if (original.isReversed) {
    throw new Error("Journal entry has already been reversed");
  }

  const reversal = await client.journalEntry.create({
    data: {
      date: opts.date ?? new Date(),
      refType: original.refType,
      refId: original.refId,
      narration: opts.narration,
      narrationKey: opts.narrationKey ?? null,
      narrationParams: opts.narrationParams ? JSON.stringify(opts.narrationParams) : null,
      createdBy: opts.createdBy,
      reversalOf: original.id,
      lines: {
        create: original.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.credit,
          credit: l.debit,
          farmId: l.farmId,
          vendorTagId: l.vendorTagId,
          narration: l.narration,
        })),
      },
    },
    include: { lines: true },
  });

  await client.journalEntry.update({
    where: { id: original.id },
    data: { isReversed: true },
  });

  return reversal;
}

/** Net balance (debit − credit) of an account from posted, non-reversed journal lines. Rate-difference vendor tags are excluded automatically since they live on the Rate Difference account, not the vendor account. */
export async function getAccountBalance(accountId: string, client: Tx | typeof prisma = prisma): Promise<number> {
  const lines = await client.journalLine.findMany({
    where: {
      accountId,
      entry: { isReversed: false },
    },
    select: { debit: true, credit: true },
  });
  return lines.reduce((bal, l) => bal + l.debit - l.credit, 0);
}
