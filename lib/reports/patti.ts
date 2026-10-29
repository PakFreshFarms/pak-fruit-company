import { prisma } from "@/lib/db/prisma";
import { computeBiltiExpenses, computePattiTotals } from "@/lib/accounting/calculations";
import { getAccountBalance } from "@/lib/journal";
import { getCommissionRatePercent, getSetting } from "@/lib/settings";

export async function getPattiData(voucherId: string) {
  const voucher = await prisma.voucher.findUniqueOrThrow({
    where: { id: voucherId },
    include: {
      vendor: true,
      bilti: { include: { expenses: true, vouchers: { select: { id: true, crates: true, kirayaOverride: true } } } },
      lots: { include: { sales: { where: { cancelledAt: null }, include: { customer: true } } } },
    },
  });

  const breakdowns = computeBiltiExpenses(voucher.bilti.expenses, voucher.bilti.vouchers, voucher.bilti.totalCrates);
  const expenseBreakdown = breakdowns.find((b) => b.voucherId === voucher.id)!;

  const grossReport = voucher.lots.reduce((sum, lot) => sum + lot.reportRate * lot.sales.reduce((s, sale) => s + sale.crates, 0), 0);
  const actualTotal = voucher.lots.reduce((sum, lot) => sum + lot.sales.reduce((s, sale) => s + sale.actualRate * sale.crates, 0), 0);
  const rateDifference = actualTotal - grossReport;

  const commissionRate = await getCommissionRatePercent();
  const totals = computePattiTotals(grossReport, expenseBreakdown.total, commissionRate);

  const closingBalance = await getAccountBalance(voucher.vendorId);
  const previousBalance = closingBalance + totals.netPayable;

  const entryDateFilter = { isReversed: false, ...(voucher.pattiDate ? { date: { lte: voucher.pattiDate } } : {}) };
  const advanceLines = await prisma.journalLine.findMany({
    where: {
      accountId: voucher.vendorId,
      debit: { gt: 0 },
      OR: [
        { entry: { ...entryDateFilter, narrationKey: "narration.cashAdvance" } },
        { entry: entryDateFilter, narration: { contains: "advance" } },
      ],
    },
  });
  const advanceAdjusted = advanceLines.reduce((s, l) => s + l.debit, 0);

  const shopName = await getSetting("shopName", "Pak Fruit Company");
  const shopAddress = await getSetting("shopAddress", "");

  return {
    voucher,
    shopName,
    shopAddress,
    commissionRate,
    grossReport,
    actualTotal,
    rateDifference,
    totals,
    expenseBreakdown,
    closingBalance,
    previousBalance,
    advanceAdjusted,
  };
}
