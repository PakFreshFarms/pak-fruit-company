import { getAccountBalancesByType } from "@/lib/reports/balances";
import { prisma } from "@/lib/db/prisma";
import { VendorsListView } from "@/components/vendors/VendorsListView";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const rows = await getAccountBalancesByType("VENDOR");
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
    <VendorsListView
      vendors={rows.map((r) => ({
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
