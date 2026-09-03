// Pure calculation functions for the commission workflow (spec section 6).
// No I/O here — these are unit-testable in isolation and reused by the
// service layer that actually writes to the database.

import { splitTruckTotal } from "@/lib/money";

export type ExpenseBasis = "PER_CRATE" | "TRUCK_TOTAL_SPLIT" | "FIXED_PER_VOUCHER";

export interface VoucherForExpense {
  id: string;
  crates: number;
  kirayaOverride?: number | null;
}

export interface BiltiExpenseRate {
  id: string;
  head: string;
  basis: ExpenseBasis;
  rate: number; // paisa: per-crate rate, or truck-total amount, depending on basis
}

/** Amount a single voucher owes for one expense head — rule 6.5. `biltiTotalCrates` is only used by TRUCK_TOTAL_SPLIT and is ignored otherwise (that head's exact split, including the rounding remainder, must be computed across ALL vouchers via computeBiltiExpenses). */
export function computeExpenseAmountForVoucher(
  expense: BiltiExpenseRate,
  voucher: VoucherForExpense,
  biltiTotalCrates: number,
): number {
  const effectiveRate = expense.head === "KIRAYA" && voucher.kirayaOverride != null ? voucher.kirayaOverride : expense.rate;
  switch (expense.basis) {
    case "PER_CRATE":
      return effectiveRate * voucher.crates;
    case "FIXED_PER_VOUCHER":
      return effectiveRate;
    case "TRUCK_TOTAL_SPLIT":
      return Math.round((effectiveRate * voucher.crates) / biltiTotalCrates);
    default:
      return 0;
  }
}

export interface VoucherExpenseBreakdown {
  voucherId: string;
  lines: { head: string; label: string; amount: number; expenseAccountId: string }[];
  total: number;
}

/**
 * Computes every voucher's expense breakdown for a bilti in one pass, so that
 * TRUCK_TOTAL_SPLIT heads reconcile exactly to the truck total (the rounding
 * remainder goes to the voucher with the most crates — rule 4.4/6.5).
 * Kiraya's per-voucher override, when present, replaces the bilti rate for
 * that voucher only and is never itself split — it's a per-crate rate so
 * PER_CRATE math already isolates it per voucher.
 */
export function computeBiltiExpenses(
  expenses: (BiltiExpenseRate & { label: string; expenseAccountId: string })[],
  vouchers: VoucherForExpense[],
  biltiTotalCrates: number,
): VoucherExpenseBreakdown[] {
  const perVoucherHeadAmount: Record<string, Record<string, number>> = {};
  for (const v of vouchers) perVoucherHeadAmount[v.id] = {};

  for (const exp of expenses) {
    if (exp.basis === "TRUCK_TOTAL_SPLIT") {
      // The rate is the whole-truck amount; split once across all vouchers so
      // the rounding remainder lands on exactly one voucher (rule 4.4/6.5).
      // A kiraya override doesn't apply here — it's a per-crate rate and only
      // makes sense under PER_CRATE/FIXED_PER_VOUCHER bases.
      const split = splitTruckTotal(exp.rate, vouchers, biltiTotalCrates);
      for (const v of vouchers) perVoucherHeadAmount[v.id][exp.head] = split[v.id] ?? 0;
    } else {
      for (const v of vouchers) {
        perVoucherHeadAmount[v.id][exp.head] = computeExpenseAmountForVoucher(exp, v, biltiTotalCrates);
      }
    }
  }

  return vouchers.map((v) => {
    const lines = expenses.map((exp) => ({
      head: exp.head,
      label: exp.label,
      amount: perVoucherHeadAmount[v.id][exp.head] ?? 0,
      expenseAccountId: exp.expenseAccountId,
    }));
    return { voucherId: v.id, lines, total: lines.reduce((s, l) => s + l.amount, 0) };
  });
}

export interface SaleCalc {
  reportAmount: number;
  actualAmount: number;
  rateDifference: number; // positive = client gained, negative = concession
}

/** Rule 6.2: the dual-rate difference for one sale line. */
export function computeSale(reportRate: number, actualRate: number, crates: number): SaleCalc {
  const reportAmount = reportRate * crates;
  const actualAmount = actualRate * crates;
  return { reportAmount, actualAmount, rateDifference: actualAmount - reportAmount };
}

export interface PattiTotals {
  grossReport: number;
  commission: number;
  totalExpenses: number;
  netPayable: number;
}

/** Rule 6.6: commission is charged on the REPORT amount, not the actual amount. */
export function computePattiTotals(grossReport: number, totalExpenses: number, commissionRatePercent: number): PattiTotals {
  const commission = Math.round((grossReport * commissionRatePercent) / 100);
  const netPayable = grossReport - commission - totalExpenses;
  return { grossReport, commission, totalExpenses, netPayable };
}
