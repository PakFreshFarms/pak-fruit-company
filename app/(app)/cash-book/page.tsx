import { prisma } from "@/lib/db/prisma";
import { getCashInHandDayLines, getCashInHandOpeningBalance } from "@/lib/reports/cashbook";
import { CashBookView } from "@/components/cash/CashBookView";

export const dynamic = "force-dynamic";

export default async function CashBookPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ? new Date(dateParam) : new Date();

  const [lines, opening, accounts] = await Promise.all([
    getCashInHandDayLines(date),
    getCashInHandOpeningBalance(date),
    prisma.account.findMany({ where: { isActive: true, type: { not: "CASH" } }, orderBy: { name: "asc" } }),
  ]);

  const closing = opening + lines.reduce((s, l) => s + l.debit - l.credit, 0);

  return (
    <CashBookView
      date={date.toISOString()}
      opening={opening}
      closing={closing}
      lines={lines.map((l) => ({ ...l, date: l.date.toISOString() }))}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name, nameUr: a.nameUr, code: a.code }))}
    />
  );
}
