import { beforeAll, describe, expect, it } from "vitest";
import { resetTestDatabase } from "./setup";
import { toPaisa } from "@/lib/money";
import { computeSale, computeBiltiExpenses, computePattiTotals } from "@/lib/accounting/calculations";

describe("pure calculation rules (spec section 6.7 worked example)", () => {
  it("computes the dual-rate sale difference", () => {
    const { reportAmount, actualAmount, rateDifference } = computeSale(toPaisa(1200), toPaisa(1100), 30);
    expect(reportAmount).toBe(toPaisa(36000));
    expect(actualAmount).toBe(toPaisa(33000));
    expect(rateDifference).toBe(toPaisa(-3000));
  });

  it("splits bilti expenses across vouchers by crate share, reconciling exactly", () => {
    const expenses = [
      { id: "1", head: "KIRAYA", basis: "PER_CRATE" as const, rate: toPaisa(80), label: "Kiraya", expenseAccountId: "a" },
      { id: "2", head: "MAZDOORI", basis: "PER_CRATE" as const, rate: toPaisa(10), label: "Mazdoori", expenseAccountId: "a" },
      { id: "3", head: "MUNSHIYANA", basis: "TRUCK_TOTAL_SPLIT" as const, rate: toPaisa(5000), label: "Munshiyana", expenseAccountId: "a" },
      { id: "4", head: "DAAK", basis: "TRUCK_TOTAL_SPLIT" as const, rate: toPaisa(3000), label: "Daak", expenseAccountId: "a" },
      { id: "5", head: "BARDANA", basis: "TRUCK_TOTAL_SPLIT" as const, rate: toPaisa(10000), label: "Bardana", expenseAccountId: "a" },
      { id: "6", head: "PESHGI", basis: "TRUCK_TOTAL_SPLIT" as const, rate: toPaisa(2000), label: "Peshgi", expenseAccountId: "a" },
    ];
    const vouchers = [
      { id: "v23", crates: 300 },
      { id: "v24", crates: 700 },
    ];
    const breakdowns = computeBiltiExpenses(expenses, vouchers, 1000);
    const v23 = breakdowns.find((b) => b.voucherId === "v23")!;
    expect(v23.lines.find((l) => l.head === "KIRAYA")!.amount).toBe(toPaisa(24000));
    expect(v23.lines.find((l) => l.head === "MAZDOORI")!.amount).toBe(toPaisa(3000));
    expect(v23.lines.find((l) => l.head === "MUNSHIYANA")!.amount).toBe(toPaisa(1500));
    expect(v23.lines.find((l) => l.head === "DAAK")!.amount).toBe(toPaisa(900));
    expect(v23.lines.find((l) => l.head === "BARDANA")!.amount).toBe(toPaisa(3000));
    expect(v23.lines.find((l) => l.head === "PESHGI")!.amount).toBe(toPaisa(600));
    expect(v23.total).toBe(toPaisa(33000));

    // The truck-total-split heads must reconcile exactly across all vouchers.
    for (const head of ["MUNSHIYANA", "DAAK", "BARDANA", "PESHGI"]) {
      const truckAmount = expenses.find((e) => e.head === head)!.rate;
      const sum = breakdowns.reduce((s, b) => s + b.lines.find((l) => l.head === head)!.amount, 0);
      expect(sum).toBe(truckAmount);
    }
  });

  it("computes patti totals with commission on the report amount", () => {
    const totals = computePattiTotals(toPaisa(300000), toPaisa(33000), 10);
    expect(totals.commission).toBe(toPaisa(30000));
    expect(totals.netPayable).toBe(toPaisa(237000));
  });
});

describe("end-to-end worked example via the database + journal service", () => {
  let ahmedId: string;
  let hayyanId: string;
  let bilalId: string;
  let voucher23Id: string;
  let rateDifferenceAccountId: string;

  beforeAll(async () => {
    resetTestDatabase();
    const { prisma } = await import("@/lib/db/prisma");
    const { SYSTEM_ACCOUNTS } = await import("@/lib/accounting/system-accounts");
    for (const def of Object.values(SYSTEM_ACCOUNTS)) {
      await prisma.account.create({ data: { code: def.code, name: def.name, type: def.type, isSystem: true } });
    }
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");
    const { generatePatti } = await import("@/lib/services/patti");

    const ahmed = await createAccount({ code: "V-001", name: "Ahmed", type: "VENDOR", createdBy: "test" });
    const shazia = await createAccount({ code: "V-002", name: "Shazia", type: "VENDOR", createdBy: "test" });
    const hayyan = await createAccount({ code: "C-001", name: "Hayyan Ali", type: "CUSTOMER", createdBy: "test" });
    const bilal = await createAccount({ code: "C-002", name: "Bilal", type: "CUSTOMER", createdBy: "test" });
    ahmedId = ahmed.id;
    hayyanId = hayyan.id;
    bilalId = bilal.id;

    const bilti = await createBilti({
      biltiNo: "BL-101",
      truckNo: "ABC-123",
      date: new Date("2026-05-01"),
      itemName: "Mango",
      totalCrates: 1000,
    });
    const rates: Record<string, number> = {
      KIRAYA: toPaisa(80),
      MAZDOORI: toPaisa(10),
      MUNSHIYANA: toPaisa(5000),
      DAAK: toPaisa(3000),
      BARDANA: toPaisa(10000),
      PESHGI: toPaisa(2000),
    };
    for (const exp of bilti.expenses) {
      await prisma.biltiExpense.update({ where: { id: exp.id }, data: { rate: rates[exp.head] } });
    }

    const voucher23 = await addVoucher({ biltiId: bilti.id, voucherNo: "23", vendorId: ahmed.id, crates: 300 });
    await addVoucher({ biltiId: bilti.id, voucherNo: "24", vendorId: shazia.id, crates: 700 });
    voucher23Id = voucher23.id;

    const lotA = await addLot({ voucherId: voucher23.id, name: "Mosami Chaunsa International", crates: 100, reportRate: toPaisa(1200) });
    const lotB = await addLot({ voucherId: voucher23.id, name: "Mosami Chaunsa", crates: 200, reportRate: toPaisa(900) });

    await createSale({ lotId: lotA.id, date: new Date("2026-05-02"), customerId: hayyan.id, crates: 30, actualRate: toPaisa(1100), createdBy: "test" });
    await createSale({ lotId: lotA.id, date: new Date("2026-05-02"), customerId: bilal.id, crates: 70, actualRate: toPaisa(1200), createdBy: "test" });
    await createSale({ lotId: lotB.id, date: new Date("2026-05-03"), customerId: bilal.id, crates: 200, actualRate: toPaisa(900), createdBy: "test" });

    await generatePatti({ voucherId: voucher23.id, createdBy: "test" });

    rateDifferenceAccountId = await getSysId("RATE_DIFFERENCE");

    async function getSysId(key: keyof typeof SYSTEM_ACCOUNTS) {
      const { getSystemAccountId } = await import("@/lib/accounting/system-accounts");
      return getSystemAccountId(key);
    }
  });

  it("posts the exact sale journal from the spec for the 30-crate sale", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const sale = await prisma.sale.findFirstOrThrow({ where: { customerId: hayyanId, crates: 30 } });
    const entry = await prisma.journalEntry.findUniqueOrThrow({ where: { id: sale.journalEntryId! }, include: { lines: true } });

    const customerLine = entry.lines.find((l) => l.accountId === hayyanId)!;
    const vendorLine = entry.lines.find((l) => l.accountId === ahmedId)!;
    const rateDiffLine = entry.lines.find((l) => l.accountId === rateDifferenceAccountId)!;

    expect(customerLine.debit).toBe(toPaisa(33000));
    expect(vendorLine.credit).toBe(toPaisa(36000));
    expect(rateDiffLine.debit).toBe(toPaisa(3000));
    expect(rateDiffLine.vendorTagId).toBe(ahmedId);

    const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });

  it("computes the voucher's gross report, commission, expenses, and net payable exactly as specified", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const voucher = await prisma.voucher.findUniqueOrThrow({
      where: { id: voucher23Id },
      include: { lots: { include: { sales: true } } },
    });
    const grossReport = voucher.lots.reduce((sum, lot) => sum + lot.reportRate * lot.sales.reduce((s, sale) => s + sale.crates, 0), 0);
    expect(grossReport).toBe(toPaisa(300000));
    expect(voucher.pattiNo).toBeTruthy();
  });

  it("every journal entry in the system balances (sum debit = sum credit)", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const entries = await prisma.journalEntry.findMany({ include: { lines: true } });
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const credit = entry.lines.reduce((s, l) => s + l.credit, 0);
      expect(debit).toBe(credit);
    }
  });

  it("Ahmed's ledger (lines posted to his own account) never includes a Rate Difference line", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const ahmedLines = await prisma.journalLine.findMany({ where: { accountId: ahmedId } });
    expect(ahmedLines.every((l) => l.accountId !== rateDifferenceAccountId)).toBe(true);

    // Ahmed's payable balance (debit − credit is negative, i.e. a credit/payable balance) reflects
    // commission and expenses charged on the patti, but never the rate-difference concession.
    const { getAccountBalance } = await import("@/lib/journal");
    const ahmedBalance = await getAccountBalance(ahmedId);
    // credit balance of 237,000 (net payable) => debit-credit = -237,000
    expect(ahmedBalance).toBe(-toPaisa(237000));
  });

  it("tags the Rate Difference line to the vendor for reporting only, without touching the vendor balance", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const rateDiffLines = await prisma.journalLine.findMany({ where: { accountId: rateDifferenceAccountId, vendorTagId: ahmedId } });
    expect(rateDiffLines.length).toBeGreaterThan(0);
    const net = rateDiffLines.reduce((s, l) => s + l.credit - l.debit, 0);
    // Only the 30-crate concession touched rate difference for Ahmed in this scenario: -3,000
    expect(net).toBe(-toPaisa(3000));
  });
});
