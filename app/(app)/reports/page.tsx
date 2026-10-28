import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getTrialBalance, getRateDifferenceReport, getExpenseRecoveryVsPaid, getBiltiProfitability, getSeasonClosingReport, getCommissionByVendor, getCancelledSales } from "@/lib/reports/misc";
import { getAccountBalancesByType } from "@/lib/reports/balances";
import { getAllCustomersAgeing } from "@/lib/reports/ageing";
import { getAllFarmSummaries } from "@/lib/reports/farm";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();
  const from = startOfMonth(subMonths(now, 1));
  const to = endOfMonth(now);

  const [trialBalance, vendorBalances, customerBalances, ageing, commissionByVendor, rateDiff, expenseVsPaid, biltiProfitability, farms, seasonClosing, cancelledSales] =
    await Promise.all([
      getTrialBalance(),
      getAccountBalancesByType("VENDOR"),
      getAccountBalancesByType("CUSTOMER"),
      getAllCustomersAgeing(),
      getCommissionByVendor(from, to),
      getRateDifferenceReport(),
      getExpenseRecoveryVsPaid(),
      getBiltiProfitability(),
      getAllFarmSummaries(),
      getSeasonClosingReport(from, to),
      getCancelledSales(),
    ]);

  return (
    <ReportsView
      trialBalance={{
        rows: trialBalance.rows.map((r) => ({ name: r.account.name, code: r.account.code, type: r.account.type, debit: r.debit, credit: r.credit })),
        totalDebit: trialBalance.totalDebit,
        totalCredit: trialBalance.totalCredit,
      }}
      vendorBalances={vendorBalances.map((r) => ({ name: r.account.name, code: r.account.code, balance: r.balance }))}
      customerBalances={customerBalances.map((r) => ({ name: r.account.name, code: r.account.code, balance: r.balance }))}
      ageing={ageing.map((a) => ({ name: a.customer.name, ...a.buckets }))}
      commissionByVendor={commissionByVendor}
      rateDiff={rateDiff.map((r) => ({ name: r.vendor.name, ...r.position }))}
      expenseVsPaid={expenseVsPaid}
      biltiProfitability={biltiProfitability.map((b) => ({ ...b, date: b.date.toISOString() }))}
      farms={farms.map((f) => ({
        name: f.farm.name,
        season: f.farm.season,
        rentAmount: f.farm.rentAmount,
        totalExpenses: f.totalExpenses,
        totalDispatchIncome: f.totalDispatchIncome,
        netResult: f.netResult,
      }))}
      seasonClosing={seasonClosing}
      cancelledSales={cancelledSales.map((s) => ({ ...s, date: s.date.toISOString(), cancelledAt: s.cancelledAt.toISOString() }))}
    />
  );
}
