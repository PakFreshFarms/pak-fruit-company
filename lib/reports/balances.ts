import { prisma } from "@/lib/db/prisma";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";
import type { AccountType } from "@prisma/client";

/** Net (debit − credit) balance per account of a given type, from posted non-reversed journal lines only. Excludes Rate Difference lines automatically since those never post to a vendor/customer account. */
export async function getAccountBalancesByType(type: AccountType) {
  const accounts = await prisma.account.findMany({ where: { type, isActive: true }, orderBy: { name: "asc" } });
  const grouped = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accounts.map((a) => a.id) }, entry: { isReversed: false } },
    _sum: { debit: true, credit: true },
  });
  const balanceMap = new Map(grouped.map((g) => [g.accountId, (g._sum.debit ?? 0) - (g._sum.credit ?? 0)]));
  return accounts.map((a) => ({ account: a, balance: balanceMap.get(a.id) ?? 0 }));
}

export async function getAccountBalanceMap(accountIds: string[]) {
  if (accountIds.length === 0) return new Map<string, number>();
  const grouped = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accountIds }, entry: { isReversed: false } },
    _sum: { debit: true, credit: true },
  });
  return new Map(grouped.map((g) => [g.accountId, (g._sum.debit ?? 0) - (g._sum.credit ?? 0)]));
}

/** Total owed to vendors: sum of credit (payable) balances only. */
export async function getVendorPayableTotal() {
  const rows = await getAccountBalancesByType("VENDOR");
  return rows.reduce((sum, r) => sum + Math.max(0, -r.balance), 0);
}

/** Total owed by customers: sum of debit (receivable) balances only. */
export async function getCustomerReceivableTotal() {
  const rows = await getAccountBalancesByType("CUSTOMER");
  return rows.reduce((sum, r) => sum + Math.max(0, r.balance), 0);
}

export async function getCashInHandBalance() {
  const cashId = await getSystemAccountId("CASH_IN_HAND");
  const map = await getAccountBalanceMap([cashId]);
  return map.get(cashId) ?? 0;
}

export async function getCommissionForPeriod(from: Date, to: Date) {
  const commissionId = await getSystemAccountId("COMMISSION_INCOME");
  const agg = await prisma.journalLine.aggregate({
    where: { accountId: commissionId, entry: { isReversed: false, date: { gte: from, lte: to } } },
    _sum: { credit: true, debit: true },
  });
  return (agg._sum.credit ?? 0) - (agg._sum.debit ?? 0);
}

/** Net rate-difference position (credit = net gain, debit-heavy = net concessions given). */
export async function getNetRateDifference() {
  const rateDiffId = await getSystemAccountId("RATE_DIFFERENCE");
  const map = await getAccountBalanceMap([rateDiffId]);
  return -(map.get(rateDiffId) ?? 0); // flip sign: credit balance (gain) should read positive
}

export async function getOpenBiltisWithUnsoldCrates() {
  const biltis = await prisma.bilti.findMany({
    where: { status: "OPEN" },
    include: { vouchers: { include: { lots: { include: { sales: true } } } } },
    orderBy: { date: "desc" },
  });
  return biltis.filter((b) =>
    b.vouchers.some((v) => v.lots.some((l) => l.crates > l.sales.reduce((s, sale) => s + sale.crates, 0))),
  );
}

export async function getVouchersAwaitingPatti(limit = 10) {
  const vouchers = await prisma.voucher.findMany({
    where: { status: "OPEN" },
    include: { vendor: true, bilti: true, lots: { include: { sales: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return vouchers.map((v) => {
    const totalCrates = v.lots.reduce((s, l) => s + l.crates, 0);
    const soldCrates = v.lots.reduce((s, l) => s + l.sales.reduce((ss, sale) => ss + sale.crates, 0), 0);
    return { voucher: v, totalCrates, soldCrates, remaining: totalCrates - soldCrates };
  });
}

export async function getOldestOutstandingCustomers(limit = 5) {
  const rows = await getAccountBalancesByType("CUSTOMER");
  const outstanding = rows.filter((r) => r.balance > 0);
  const withOldest = await Promise.all(
    outstanding.map(async (r) => {
      const oldestSale = await prisma.sale.findFirst({ where: { customerId: r.account.id }, orderBy: { date: "asc" } });
      return { ...r, oldestDate: oldestSale?.date ?? null };
    }),
  );
  return withOldest
    .filter((r) => r.oldestDate)
    .sort((a, b) => (a.oldestDate!.getTime() ?? 0) - (b.oldestDate!.getTime() ?? 0))
    .slice(0, limit);
}
