import { prisma } from "@/lib/db/prisma";

export async function getFarmSummary(farmId: string) {
  const farm = await prisma.farm.findUniqueOrThrow({
    where: { id: farmId },
    include: { expenses: true, dispatches: true },
  });

  const expensesByHead = new Map<string, number>();
  for (const e of farm.expenses) {
    expensesByHead.set(e.head, (expensesByHead.get(e.head) ?? 0) + e.amount);
  }
  const totalExpenses = farm.expenses.reduce((s, e) => s + e.amount, 0);

  const receivedDispatches = farm.dispatches.filter((d) => d.status === "RECEIVED");
  const totalDispatchIncome = receivedDispatches.reduce((s, d) => s + d.netSaleAmount, 0);
  const receivedCrates = receivedDispatches.reduce((s, d) => s + d.crates, 0);

  const netResult = totalDispatchIncome - totalExpenses;
  const costPerCrate = receivedCrates > 0 ? Math.round(totalExpenses / receivedCrates) : 0;
  const realisationPerCrate = receivedCrates > 0 ? Math.round(totalDispatchIncome / receivedCrates) : 0;

  return {
    farm,
    expensesByHead: [...expensesByHead.entries()].map(([head, amount]) => ({ head, amount })),
    totalExpenses,
    totalDispatchIncome,
    receivedCrates,
    netResult,
    costPerCrate,
    realisationPerCrate,
  };
}

export async function getAllFarmSummaries() {
  const farms = await prisma.farm.findMany({ orderBy: { startDate: "desc" } });
  return Promise.all(farms.map((f) => getFarmSummary(f.id)));
}
