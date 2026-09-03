import { prisma } from "@/lib/db/prisma";
import { computeBiltiExpenses } from "@/lib/accounting/calculations";

export async function getBiltiDetail(biltiId: string) {
  const bilti = await prisma.bilti.findUnique({
    where: { id: biltiId },
    include: {
      expenses: true,
      vouchers: {
        include: {
          vendor: true,
          lots: { include: { sales: { include: { customer: true } } } },
        },
        orderBy: { voucherNo: "asc" },
      },
    },
  });
  if (!bilti) return null;

  const breakdowns = computeBiltiExpenses(bilti.expenses, bilti.vouchers, bilti.totalCrates);
  const breakdownByVoucher = new Map(breakdowns.map((b) => [b.voucherId, b]));

  const assignedCrates = bilti.vouchers.reduce((s, v) => s + v.crates, 0);

  return {
    bilti,
    assignedCrates,
    unassignedCrates: bilti.totalCrates - assignedCrates,
    vouchers: bilti.vouchers.map((v) => {
      const lotCrates = v.lots.reduce((s, l) => s + l.crates, 0);
      const soldCrates = v.lots.reduce((s, l) => s + l.sales.reduce((ss, sale) => ss + sale.crates, 0), 0);
      const grossReport = v.lots.reduce((sum, lot) => sum + lot.reportRate * lot.sales.reduce((s, sale) => s + sale.crates, 0), 0);
      return {
        voucher: v,
        expenseBreakdown: breakdownByVoucher.get(v.id)!,
        lotCrates,
        soldCrates,
        unassignedLotCrates: v.crates - lotCrates,
        grossReport,
        canGeneratePatti: v.status === "OPEN" && v.lots.length > 0,
        fullySold: v.lots.length > 0 && v.lots.every((l) => l.crates === l.sales.reduce((s, sale) => s + sale.crates, 0)),
      };
    }),
  };
}
