import { getAccountBalancesByType } from "@/lib/reports/balances";
import { prisma } from "@/lib/db/prisma";
import { CustomersListView } from "@/components/customers/CustomersListView";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const rows = await getAccountBalancesByType("CUSTOMER");
  const lastActivities = await Promise.all(
    rows.map(async (r) => {
      const last = await prisma.journalLine.findFirst({
        where: { accountId: r.account.id },
        orderBy: { entry: { date: "desc" } },
        include: { entry: true },
      });
      return { id: r.account.id, lastActivity: last?.entry.date.toISOString() ?? null };
    }),
  );
  const lastMap = new Map(lastActivities.map((l) => [l.id, l.lastActivity]));

  return (
    <CustomersListView
      customers={rows.map((r) => ({
        id: r.account.id,
        code: r.account.code,
        name: r.account.name,
        nameUr: r.account.nameUr,
        phone: r.account.phone,
        balance: r.balance,
        lastActivity: lastMap.get(r.account.id) ?? null,
      }))}
    />
  );
}
