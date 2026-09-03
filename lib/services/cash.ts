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
  narration: string;
  farmId?: string;
  createdBy: string;
}

/**
 * Every cash/wasooli line posts straight to the general journal (rule 4.8):
 * IN moves money from the contra account into cash (Dr Cash / Cr contra);
 * OUT moves it the other way (Dr contra / Cr Cash).
 */
export async function createCashEntry(input: CreateCashEntryInput) {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");

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
        narration: input.narration,
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
        narration: input.narration,
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
    narration: input.narration ?? "Vendor advance",
    createdBy: input.createdBy,
  });
}
