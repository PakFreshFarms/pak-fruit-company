import { getWasooliEntries } from "@/lib/reports/cashbook";
import { getAccountBalanceMap } from "@/lib/reports/balances";
import { WasooliView } from "@/components/cash/WasooliView";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function WasooliPage() {
  const [entries, customers] = await Promise.all([
    getWasooliEntries(),
    prisma.account.findMany({ where: { type: "CUSTOMER", isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const balances = await getAccountBalanceMap(customers.map((c) => c.id));

  return (
    <WasooliView
      entries={entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        customerName: e.account.name,
        amount: e.amount,
        mode: e.mode,
        reference: e.reference,
        narration: e.narration,
      }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, code: c.code, balance: balances.get(c.id) ?? 0 }))}
    />
  );
}
