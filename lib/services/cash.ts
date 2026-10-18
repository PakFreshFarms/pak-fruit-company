import { prisma } from "@/lib/db/prisma";
import { postJournal } from "@/lib/journal";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";

export interface CreateCashEntryInput {
  date: Date;
  book: "CASH" | "WASOOLI";
  direction: "IN" | "OUT";
  accountId: string; // the contra account: vendor, customer, expense head, farm, etc.
  amount: number;
  mode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
  reference?: string;
  /** User-typed narration. When omitted, a structured default (narrationKey) is used instead so the entry reads correctly in whichever language is active. */
  narration?: string;
  /** Structured default to fall back to when `narration` is empty — e.g. "narration.cashAdvance". Ignored if `narration` is provided. */
  narrationKey?: string;
  farmId?: string;
  createdBy: string;
}

const NARRATION_KEY_FALLBACK_EN: Record<string, string> = {
  "narration.cashAdvance": "Vendor advance",
  "narration.cashRecovery": "Wasooli recovery",
  "narration.cashOut": "Cash paid",
  "narration.cashIn": "Cash received",
};

/**
 * Every cash/wasooli line posts straight to the general journal (rule 4.8):
 * IN moves money from the contra account into cash (Dr Cash / Cr contra);
 * OUT moves it the other way (Dr contra / Cr Cash).
 */
export async function createCashEntry(input: CreateCashEntryInput) {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");

  const hasCustomNarration = !!input.narration?.trim();
  const narrationKey = hasCustomNarration ? null : (input.narrationKey ?? null);
  const narration = hasCustomNarration
    ? input.narration!.trim()
    : (narrationKey && NARRATION_KEY_FALLBACK_EN[narrationKey]) || input.narration || "Cash entry";

  return prisma.$transaction(async (tx) => {
    const cashAccountId = await getSystemAccountId("CASH_IN_HAND", tx);

    const lines =
      input.direction === "IN"
        ? [
            { accountId: cashAccountId, debit: input.amount, credit: 0 },
            { accountId: input.accountId, debit: 0, credit: input.amount, farmId: input.farmId },
          ]
        : [
            { accountId: input.accountId, debit: input.amount, credit: 0, farmId: input.farmId },
            { accountId: cashAccountId, debit: 0, credit: input.amount },
          ];

    const entry = await postJournal(
      {
        date: input.date,
        refType: input.book,
        narration,
        narrationKey,
        createdBy: input.createdBy,
        lines,
      },
      tx,
    );

    return tx.cashEntry.create({
      data: {
        date: input.date,
        book: input.book,
        direction: input.direction,
        accountId: input.accountId,
        amount: input.amount,
        mode: input.mode,
        reference: input.reference,
        narration,
        journalEntryId: entry.id,
      },
    });
  });
}

/** Vendor advance: Dr Vendor / Cr Cash in Hand — reduces what the client owes that vendor (rule 5.1). */
export async function payVendorAdvance(input: {
  vendorId: string;
  amount: number;
  date: Date;
  narration?: string;
  mode?: CreateCashEntryInput["mode"];
  reference?: string;
  createdBy: string;
}) {
  return createCashEntry({
    date: input.date,
    book: "CASH",
    direction: "OUT",
    accountId: input.vendorId,
    amount: input.amount,
    mode: input.mode ?? "CASH",
    reference: input.reference,
    narration: input.narration,
    narrationKey: "narration.cashAdvance",
    createdBy: input.createdBy,
  });
}
