import { prisma } from "@/lib/db/prisma";
import { postJournal, type Tx } from "@/lib/journal";
import { computeBiltiExpenses, computePattiTotals } from "@/lib/accounting/calculations";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";
import { getCommissionRatePercent } from "@/lib/settings";

export class VoucherNotFullySoldError extends Error {
  constructor() {
    super("This voucher still has unsold crates. Tick 'close voucher with unsold crates' and give a reason, or record the remaining sales first.");
    this.name = "VoucherNotFullySoldError";
  }
}

export class ReconciliationError extends Error {
  constructor(actualTotal: number, identityRhs: number) {
    super(`Patti does not reconcile (rule 6.8): actual total ${actualTotal} paisa != net payable + commission + expenses + rate difference (${identityRhs} paisa). Nothing was posted.`);
    this.name = "ReconciliationError";
  }
}

async function nextPattiNo(tx: Tx | typeof prisma) {
  const count = await tx.voucher.count({ where: { pattiNo: { not: null } } });
  return `PT-${String(count + 1).padStart(5, "0")}`;
}

export interface GeneratePattiInput {
  voucherId: string;
  createdBy: string;
  closeWithUnsold?: boolean;
  closeReason?: string;
  pattiDate?: Date;
}

export async function generatePatti(input: GeneratePattiInput) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUniqueOrThrow({
      where: { id: input.voucherId },
      include: {
        lots: { include: { sales: { where: { cancelledAt: null } } } },
        bilti: { include: { expenses: true, vouchers: { select: { id: true, crates: true, kirayaOverride: true } } } },
      },
    });

    if (voucher.pattiNo) {
      throw new Error("A patti has already been generated for this voucher");
    }

    const unsold = voucher.lots.reduce((sum, lot) => {
      const sold = lot.sales.reduce((s, sale) => s + sale.crates, 0);
      return sum + (lot.crates - sold);
    }, 0);

    if (unsold > 0 && !input.closeWithUnsold) {
      throw new VoucherNotFullySoldError();
    }
    if (unsold > 0 && !input.closeReason) {
      throw new Error("A reason is required to close a voucher with unsold crates");
    }

    const grossReport = voucher.lots.reduce((sum, lot) => {
      const soldCrates = lot.sales.reduce((s, sale) => s + sale.crates, 0);
      return sum + lot.reportRate * soldCrates;
    }, 0);
    const actualTotal = voucher.lots.reduce((sum, lot) => sum + lot.sales.reduce((s, sale) => s + sale.actualRate * sale.crates, 0), 0);
    const rateDifference = actualTotal - grossReport;

    const breakdowns = computeBiltiExpenses(voucher.bilti.expenses, voucher.bilti.vouchers, voucher.bilti.totalCrates);
    const thisBreakdown = breakdowns.find((b) => b.voucherId === voucher.id)!;
    const totalExpenses = thisBreakdown.total;

    const commissionRate = await getCommissionRatePercent(tx);
    const totals = computePattiTotals(grossReport, totalExpenses, commissionRate);

    // Rule 6.8, enforced as a hard block rather than just displayed: the
    // customer-receivable total must equal net payable + commission +
    // expenses + rate difference exactly, in paisa. This is algebraically
    // guaranteed by computePattiTotals's own arithmetic, so it should never
    // actually trip — it's a defence against a future refactor silently
    // breaking that arithmetic and posting a wrong patti to the ledger.
    const identityRhs = totals.netPayable + totals.commission + totalExpenses + rateDifference;
    if (actualTotal !== identityRhs) {
      throw new ReconciliationError(actualTotal, identityRhs);
    }

    const commissionIncomeId = await getSystemAccountId("COMMISSION_INCOME", tx);
    const expenseRecoveryId = await getSystemAccountId("BILTI_EXPENSE_RECOVERY", tx);

    const pattiNo = await nextPattiNo(tx);
    const pattiDate = input.pattiDate ?? new Date();

    await postJournal(
      {
        date: pattiDate,
        refType: "PATTI",
        refId: voucher.id,
        narration: `Patti ${pattiNo}: commission on voucher ${voucher.voucherNo}`,
        narrationKey: "narration.pattiCommission",
        narrationParams: { pattiNo, voucherNo: voucher.voucherNo },
        createdBy: input.createdBy,
        lines: [
          { accountId: voucher.vendorId, debit: totals.commission, credit: 0 },
          { accountId: commissionIncomeId, debit: 0, credit: totals.commission },
        ],
      },
      tx,
    );

    if (totalExpenses > 0) {
      await postJournal(
        {
          date: pattiDate,
          refType: "PATTI",
          refId: voucher.id,
          narration: `Patti ${pattiNo}: expenses charged on voucher ${voucher.voucherNo}`,
          narrationKey: "narration.pattiExpenses",
          narrationParams: { pattiNo, voucherNo: voucher.voucherNo },
          createdBy: input.createdBy,
          lines: [
            { accountId: voucher.vendorId, debit: totalExpenses, credit: 0 },
            { accountId: expenseRecoveryId, debit: 0, credit: totalExpenses },
          ],
        },
        tx,
      );
    }

    const updated = await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        status: "COMPLETE",
        pattiNo,
        pattiDate,
        closedWithUnsold: unsold > 0,
        closeReason: unsold > 0 ? input.closeReason : null,
      },
    });

    const siblingVouchers = await tx.voucher.findMany({ where: { biltiId: voucher.biltiId } });
    if (siblingVouchers.every((v) => v.status === "COMPLETE")) {
      await tx.bilti.update({ where: { id: voucher.biltiId }, data: { status: "COMPLETE" } });
    }

    return { voucher: updated, totals, expenseBreakdown: thisBreakdown, pattiNo };
  });
}
