import { notFound } from "next/navigation";
import { getFarmSummary } from "@/lib/reports/farm";
import { FarmDetailView } from "@/components/farms/FarmDetailView";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function FarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [summary, user] = await Promise.all([getFarmSummary(id).catch(() => null), getCurrentUser()]);
  if (!summary) notFound();

  return (
    <FarmDetailView
      isOwner={user?.role === "OWNER"}
      farm={{
        id: summary.farm.id,
        name: summary.farm.name,
        season: summary.farm.season,
        landownerName: summary.farm.landownerName,
        rentAmount: summary.farm.rentAmount,
        rentPaid: summary.farm.rentPaid,
        isClosed: summary.farm.isClosed,
      }}
      expenses={summary.farm.expenses.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        head: e.head,
        payeeName: e.payeeName,
        amount: e.amount,
        narration: e.narration,
      }))}
      dispatches={summary.farm.dispatches.map((d) => ({
        id: d.id,
        date: d.date.toISOString(),
        truckNo: d.truckNo,
        crates: d.crates,
        netSaleAmount: d.netSaleAmount,
        marketName: d.marketName,
        status: d.status,
        chargeCommission: d.chargeCommission,
      }))}
      summary={{
        expensesByHead: summary.expensesByHead,
        totalExpenses: summary.totalExpenses,
        totalDispatchIncome: summary.totalDispatchIncome,
        receivedCrates: summary.receivedCrates,
        netResult: summary.netResult,
        costPerCrate: summary.costPerCrate,
        realisationPerCrate: summary.realisationPerCrate,
      }}
    />
  );
}
