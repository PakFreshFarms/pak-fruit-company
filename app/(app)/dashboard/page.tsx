import {
  getVendorPayableTotal,
  getCustomerReceivableTotal,
  getCashInHandBalance,
  getCommissionForPeriod,
  getNetRateDifference,
  getOpenBiltisWithUnsoldCrates,
  getVouchersAwaitingPatti,
  getOldestOutstandingCustomers,
} from "@/lib/reports/balances";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const [payable, receivable, cash, commission, rateDiff, openBiltis, awaitingPatti, oldestCustomers] = await Promise.all([
    getVendorPayableTotal(),
    getCustomerReceivableTotal(),
    getCashInHandBalance(),
    getCommissionForPeriod(startOfMonth(now), endOfMonth(now)),
    getNetRateDifference(),
    getOpenBiltisWithUnsoldCrates(),
    getVouchersAwaitingPatti(),
    getOldestOutstandingCustomers(),
  ]);

  return (
    <DashboardView
      payable={payable}
      receivable={receivable}
      cash={cash}
      commission={commission}
      rateDiff={rateDiff}
      openBiltisCount={openBiltis.length}
      awaitingPatti={awaitingPatti.map((v) => ({
        id: v.voucher.id,
        biltiId: v.voucher.biltiId,
        biltiNo: v.voucher.bilti.biltiNo,
        voucherNo: v.voucher.voucherNo,
        vendorName: v.voucher.vendor.name,
        remaining: v.remaining,
        totalCrates: v.totalCrates,
      }))}
      oldestCustomers={oldestCustomers.map((c) => ({
        id: c.account.id,
        name: c.account.name,
        balance: c.balance,
        oldestDate: c.oldestDate!.toISOString(),
      }))}
    />
  );
}
