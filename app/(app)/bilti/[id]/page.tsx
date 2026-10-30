import { notFound } from "next/navigation";
import { getBiltiDetail } from "@/lib/reports/bilti-detail";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/lib/settings";
import { SalesBookView } from "@/components/bilti/SalesBookView";

export const dynamic = "force-dynamic";

export default async function BiltiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBiltiDetail(id);
  if (!detail) notFound();

  const [vendors, customers, shopName, shopAddress] = await Promise.all([
    prisma.account.findMany({ where: { type: "VENDOR", isActive: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { type: "CUSTOMER", isActive: true }, orderBy: { name: "asc" } }),
    getSetting("shopName", "Pak Fruit Company"),
    getSetting("shopAddress", ""),
  ]);

  return (
    <SalesBookView
      bilti={{
        id: detail.bilti.id,
        biltiNo: detail.bilti.biltiNo,
        truckNo: detail.bilti.truckNo,
        date: detail.bilti.date.toISOString(),
        itemName: detail.bilti.itemName,
        totalCrates: detail.bilti.totalCrates,
        status: detail.bilti.status,
        expenses: detail.bilti.expenses.map((e) => ({ id: e.id, head: e.head, label: e.label, basis: e.basis, rate: e.rate })),
      }}
      assignedCrates={detail.assignedCrates}
      vouchers={detail.vouchers.map((v) => ({
        id: v.voucher.id,
        voucherNo: v.voucher.voucherNo,
        vendorId: v.voucher.vendorId,
        vendorName: v.voucher.vendor.name,
        crates: v.voucher.crates,
        kirayaOverride: v.voucher.kirayaOverride,
        status: v.voucher.status,
        pattiNo: v.voucher.pattiNo,
        soldCrates: v.soldCrates,
        lots: v.voucher.lots.map((l) => ({
          id: l.id,
          name: l.name,
          crates: l.crates,
          reportRate: l.reportRate,
          soldCrates: l.sales.reduce((s, sale) => s + sale.crates, 0),
          sales: l.sales.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            customerId: s.customerId,
            customerName: s.customer.name,
            crates: s.crates,
            actualRate: s.actualRate,
          })),
        })),
      }))}
      vendors={vendors.map((v) => ({ id: v.id, name: v.name, code: v.code, nameUr: v.nameUr }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, code: c.code, nameUr: c.nameUr }))}
      shopName={shopName}
      shopAddress={shopAddress}
    />
  );
}
