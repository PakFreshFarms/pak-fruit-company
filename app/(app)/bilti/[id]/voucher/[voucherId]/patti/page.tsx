import { notFound } from "next/navigation";
import { getPattiData } from "@/lib/reports/patti";
import { PattiView } from "@/components/patti/PattiView";

export const dynamic = "force-dynamic";

export default async function PattiPage({ params }: { params: Promise<{ id: string; voucherId: string }> }) {
  const { voucherId } = await params;
  const data = await getPattiData(voucherId).catch(() => null);
  if (!data || !data.voucher.pattiNo) notFound();

  return (
    <PattiView
      shopName={data.shopName}
      shopAddress={data.shopAddress}
      pattiNo={data.voucher.pattiNo!}
      pattiDate={data.voucher.pattiDate!.toISOString()}
      vendorName={data.voucher.vendor.name}
      vendorAddress={data.voucher.vendor.address}
      biltiNo={data.voucher.bilti.biltiNo}
      truckNo={data.voucher.bilti.truckNo}
      itemName={data.voucher.bilti.itemName}
      commissionRate={data.commissionRate}
      lots={data.voucher.lots.map((l) => ({
        name: l.name,
        crates: l.sales.reduce((s, sale) => s + sale.crates, 0),
        reportRate: l.reportRate,
        amount: l.reportRate * l.sales.reduce((s, sale) => s + sale.crates, 0),
      }))}
      actualTotal={data.actualTotal}
      rateDifference={data.rateDifference}
      expenseLines={data.expenseBreakdown.lines}
      totals={data.totals}
      previousBalance={data.previousBalance}
      advanceAdjusted={data.advanceAdjusted}
      closingBalance={data.closingBalance}
      closedWithUnsold={data.voucher.closedWithUnsold}
      closeReason={data.voucher.closeReason}
    />
  );
}
