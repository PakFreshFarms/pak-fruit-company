import { prisma } from "@/lib/db/prisma";
import { getSystemAccountId, EXPENSE_HEAD_TO_ACCOUNT, SYSTEM_ACCOUNTS } from "@/lib/accounting/system-accounts";
import { getAccountBalancesByType, getAccountBalanceMap } from "./balances";
import { getVendorRateDifferencePosition } from "./ledger";
import { getFarmSummary } from "./farm";
import type { AccountType } from "@prisma/client";

export async function getTrialBalance() {
  const accounts = await prisma.account.findMany({ where: { isActive: true }, orderBy: [{ type: "asc" }, { name: "asc" }] });
  const balanceMap = await getAccountBalanceMap(accounts.map((a) => a.id));
  const rows = accounts.map((a) => {
    const balance = balanceMap.get(a.id) ?? 0;
    return {
      account: a,
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? -balance : 0,
    };
  });
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, totalDebit, totalCredit };
}

export async function getCommissionByVendor(from: Date, to: Date) {
  const commissionId = await getSystemAccountId("COMMISSION_INCOME");
  const lines = await prisma.journalLine.findMany({
    where: {
      accountId: { not: commissionId },
      entry: { refType: "PATTI", narrationKey: "narration.pattiCommission", isReversed: false, date: { gte: from, lte: to } },
      debit: { gt: 0 },
    },
    include: { account: true, entry: true },
  });
  const byVendor = new Map<string, { vendorName: string; commission: number }>();
  for (const line of lines) {
    const key = line.accountId;
    const existing = byVendor.get(key) ?? { vendorName: line.account.name, commission: 0 };
    existing.commission += line.debit;
    byVendor.set(key, existing);
  }
  return [...byVendor.values()].sort((a, b) => b.commission - a.commission);
}

export async function getRateDifferenceReport() {
  const vendors = await prisma.account.findMany({ where: { type: "VENDOR", isActive: true }, orderBy: { name: "asc" } });
  const rows = await Promise.all(
    vendors.map(async (v) => ({ vendor: v, position: await getVendorRateDifferencePosition(v.id) })),
  );
  return rows.filter((r) => r.position.given > 0 || r.position.recovered > 0);
}

export async function getExpenseRecoveryVsPaid() {
  const recoveryId = await getSystemAccountId("BILTI_EXPENSE_RECOVERY");
  const recoveryMap = await getAccountBalanceMap([recoveryId]);
  const recovered = -(recoveryMap.get(recoveryId) ?? 0); // credit balance = income

  const paidAccountKeys = Object.values(EXPENSE_HEAD_TO_ACCOUNT);
  const paidAccounts = await Promise.all(paidAccountKeys.map((k) => getSystemAccountId(k)));
  const paidMap = await getAccountBalanceMap(paidAccounts);
  const rows = paidAccountKeys.map((key, i) => ({
    head: SYSTEM_ACCOUNTS[key].name,
    paid: paidMap.get(paidAccounts[i]) ?? 0,
  }));
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);

  return { recovered, totalPaid, rows, gainOrLoss: recovered - totalPaid };
}

export async function getBiltiProfitability() {
  const biltis = await prisma.bilti.findMany({
    include: { vouchers: { include: { lots: { include: { sales: { where: { cancelledAt: null } } } } } } },
    orderBy: { date: "desc" },
  });

  const commissionId = await getSystemAccountId("COMMISSION_INCOME");
  const expenseRecoveryId = await getSystemAccountId("BILTI_EXPENSE_RECOVERY");

  return Promise.all(
    biltis.map(async (b) => {
      const voucherIds = b.vouchers.map((v) => v.id);
      const [commissionLines, recoveryLines] = await Promise.all([
        prisma.journalLine.findMany({ where: { accountId: commissionId, entry: { refId: { in: voucherIds }, isReversed: false } } }),
        prisma.journalLine.findMany({ where: { accountId: expenseRecoveryId, entry: { refId: { in: voucherIds }, isReversed: false } } }),
      ]);
      const commission = commissionLines.reduce((s, l) => s + l.credit, 0);
      const expenseRecovery = recoveryLines.reduce((s, l) => s + l.credit, 0);
      const totalCrates = b.totalCrates;
      const soldCrates = b.vouchers.reduce((s, v) => s + v.lots.reduce((ss, l) => ss + l.sales.reduce((sss, sale) => sss + sale.crates, 0), 0), 0);
      return {
        id: b.id,
        biltiNo: b.biltiNo,
        truckNo: b.truckNo,
        date: b.date,
        itemName: b.itemName,
        totalCrates,
        soldCrates,
        commission,
        expenseRecovery,
        status: b.status,
      };
    }),
  );
}

export async function getSeasonClosingReport(from: Date, to: Date) {
  const [commission, rateDiffRows, expenseRecoveryVsPaid, farms, vendorBalances, customerBalances] = await Promise.all([
    (async () => {
      const commissionId = await getSystemAccountId("COMMISSION_INCOME");
      const agg = await prisma.journalLine.aggregate({
        where: { accountId: commissionId, entry: { isReversed: false, date: { gte: from, lte: to } } },
        _sum: { credit: true, debit: true },
      });
      return (agg._sum.credit ?? 0) - (agg._sum.debit ?? 0);
    })(),
    getRateDifferenceReport(),
    getExpenseRecoveryVsPaid(),
    (async () => {
      const farmList = await prisma.farm.findMany();
      return Promise.all(farmList.map((f) => getFarmSummary(f.id)));
    })(),
    getAccountBalancesByType("VENDOR" as AccountType),
    getAccountBalancesByType("CUSTOMER" as AccountType),
  ]);

  const netRateDifference = rateDiffRows.reduce((s, r) => s + r.position.net, 0);
  const farmNetTotal = farms.reduce((s, f) => s + f.netResult, 0);
  const totalVendorPayable = vendorBalances.reduce((s, r) => s + Math.max(0, -r.balance), 0);
  const totalCustomerReceivable = customerBalances.reduce((s, r) => s + Math.max(0, r.balance), 0);

  return {
    commission,
    netRateDifference,
    expenseGainOrLoss: expenseRecoveryVsPaid.gainOrLoss,
    farmNetTotal,
    totalVendorPayable,
    totalCustomerReceivable,
  };
}

/** Audit view: sales cancelled (soft-deleted) by anyone, newest first. Spec §4.2/§10 — a cancelled sale is never erased, so it must stay visible here even though it's excluded from every working total. */
export async function getCancelledSales() {
  const sales = await prisma.sale.findMany({
    where: { cancelledAt: { not: null } },
    include: { customer: true, lot: { include: { voucher: { include: { vendor: true, bilti: true } } } } },
    orderBy: { cancelledAt: "desc" },
  });
  return sales.map((s) => ({
    id: s.id,
    date: s.date,
    lotName: s.lot.name,
    biltiNo: s.lot.voucher.bilti.biltiNo,
    vendorName: s.lot.voucher.vendor.name,
    customerName: s.customer.name,
    crates: s.crates,
    actualRate: s.actualRate,
    cancelledAt: s.cancelledAt!,
    cancelledBy: s.cancelledBy,
  }));
}
