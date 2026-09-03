import { getAllFarmSummaries } from "@/lib/reports/farm";
import { FarmsListView } from "@/components/farms/FarmsListView";

export const dynamic = "force-dynamic";

export default async function FarmsPage() {
  const summaries = await getAllFarmSummaries();

  return (
    <FarmsListView
      farms={summaries.map((s) => ({
        id: s.farm.id,
        name: s.farm.name,
        season: s.farm.season,
        rentAmount: s.farm.rentAmount,
        isClosed: s.farm.isClosed,
        totalExpenses: s.totalExpenses,
        totalDispatchIncome: s.totalDispatchIncome,
        netResult: s.netResult,
      }))}
    />
  );
}
