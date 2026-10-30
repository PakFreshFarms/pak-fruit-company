import { prisma } from "@/lib/db/prisma";

/**
 * Every posted sale — a sale posts to the customer's ledger the moment it's
 * entered, independent of whether its voucher/bilti has been completed, so
 * this is the one place a munshi or owner can see today's sales. Cancelled
 * (soft-deleted) sales are excluded; those live in the cancelledSales report.
 */
export async function getSalesReport() {
  const sales = await prisma.sale.findMany({
    where: { cancelledAt: null },
    include: { customer: true, lot: { include: { voucher: { include: { vendor: true, bilti: true } } } } },
    orderBy: { date: "desc" },
  });
  return sales.map((s) => ({
    id: s.id,
    date: s.date,
    biltiNo: s.lot.voucher.bilti.biltiNo,
    voucherNo: s.lot.voucher.voucherNo,
    voucherStatus: s.lot.voucher.status,
    vendorName: s.lot.voucher.vendor.name,
    lotName: s.lot.name,
    customerName: s.customer.name,
    crates: s.crates,
    reportRate: s.lot.reportRate,
    actualRate: s.actualRate,
    amount: s.crates * s.actualRate,
  }));
}
