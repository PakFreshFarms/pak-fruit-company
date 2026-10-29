import { prisma } from "@/lib/db/prisma";
import { postJournal } from "@/lib/journal";
import { computeSale } from "@/lib/accounting/calculations";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";

export interface CreateSaleInput {
  lotId: string;
  date: Date;
  customerId: string;
  crates: number;
  actualRate: number;
  notes?: string;
  createdBy: string;
}

export class OverSoldError extends Error {
  constructor(remaining: number) {
    super(`Only ${remaining} crate(s) remain unsold in this lot`);
    this.name = "OverSoldError";
  }
}

/**
 * Records one sale line and posts its dual-rate journal entry (rule 6.4):
 *   Dr Customer            actualAmount
 *   Cr Vendor               reportAmount
 *   Dr/Cr Rate Difference   balancing figure, tagged to the vendor for reporting only
 */
export async function createSale(input: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.lot.findUniqueOrThrow({
      where: { id: input.lotId },
      include: { sales: { where: { cancelledAt: null } }, voucher: true },
    });

    const alreadySold = lot.sales.reduce((s, sale) => s + sale.crates, 0);
    const remaining = lot.crates - alreadySold;
    if (input.crates > remaining) {
      throw new OverSoldError(remaining);
    }
    if (input.crates <= 0) {
      throw new Error("Sale crates must be greater than zero");
    }

    const { reportAmount, actualAmount, rateDifference } = computeSale(lot.reportRate, input.actualRate, input.crates);

    const sale = await tx.sale.create({
      data: {
        lotId: input.lotId,
        date: input.date,
        customerId: input.customerId,
        crates: input.crates,
        actualRate: input.actualRate,
        notes: input.notes,
      },
    });

    const rateDifferenceAccountId = await getSystemAccountId("RATE_DIFFERENCE", tx);

    const lines = [
      { accountId: input.customerId, debit: actualAmount, credit: 0 },
      { accountId: lot.voucher.vendorId, debit: 0, credit: reportAmount },
    ];
    if (rateDifference > 0) {
      // Actual exceeded report: a gain for the client, credited to income.
      lines.push({ accountId: rateDifferenceAccountId, debit: 0, credit: rateDifference });
    } else if (rateDifference < 0) {
      // Actual fell short of report: a concession the client absorbed.
      lines.push({ accountId: rateDifferenceAccountId, debit: -rateDifference, credit: 0 });
    }

    const entry = await postJournal(
      {
        date: input.date,
        refType: "BILTI_SALE",
        refId: sale.id,
        narration: `Sale: lot ${lot.name}, ${input.crates} crate(s)`,
        narrationKey: "narration.saleLine",
        narrationParams: { lotName: lot.name, crates: input.crates },
        createdBy: input.createdBy,
        lines: lines.map((l) => ({
          ...l,
          vendorTagId: l.accountId === rateDifferenceAccountId ? lot.voucher.vendorId : null,
        })),
      },
      tx,
    );

    return tx.sale.update({ where: { id: sale.id }, data: { journalEntryId: entry.id } });
  });
}

/**
 * Cancels a sale: reverses its journal entry (never edited/deleted, per the
 * non-negotiable) and flags the Sale row itself as cancelled rather than
 * deleting it, so it stays visible — who cancelled it and when — in an audit
 * view, and its crates free up for resale without erasing that it happened.
 */
export async function cancelSaleWithReversal(saleId: string, cancelledBy: string) {
  const { reverseJournal } = await import("@/lib/journal");
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({ where: { id: saleId }, include: { lot: { include: { voucher: true } } } });
    if (sale.cancelledAt) {
      throw new Error("This sale has already been cancelled");
    }
    if (sale.lot.voucher.status === "COMPLETE") {
      throw new Error("This sale's patti has already been issued and cannot be cancelled — reverse the patti first");
    }
    if (sale.journalEntryId) {
      await reverseJournal(
        sale.journalEntryId,
        { narration: `Reversal of sale ${saleId}`, narrationKey: "narration.reversalOfSale", createdBy: cancelledBy },
        tx,
      );
    }
    return tx.sale.update({ where: { id: saleId }, data: { cancelledAt: new Date(), cancelledBy } });
  });
}
