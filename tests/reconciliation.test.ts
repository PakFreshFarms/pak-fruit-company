// Proves the rule 6.8 reconciliation assertion in generatePatti actually
// fires and blocks the write, rather than being a check nobody has ever
// seen fail. Since the identity (actualTotal = netPayable + commission +
// expenses + rateDifference) is algebraically guaranteed by
// computePattiTotals's own correct arithmetic, there's no way to violate it
// through normal data entry — the only way it could ever go wrong is a
// future regression in that arithmetic. So this test deliberately injects
// exactly that: it mocks computePattiTotals to return a netPayable that's
// off by one paisa for a single call, and confirms generatePatti refuses to
// post anything.
import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { resetTestDatabase } from "./setup";
import { toPaisa } from "@/lib/money";
import * as calculations from "@/lib/accounting/calculations";

vi.mock("@/lib/accounting/calculations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/accounting/calculations")>();
  return { ...actual, computePattiTotals: vi.fn(actual.computePattiTotals) };
});

describe("rule 6.8 reconciliation assertion (generatePatti)", () => {
  let voucherId: string;

  beforeAll(async () => {
    resetTestDatabase("reconciliation");
    const { prisma } = await import("@/lib/db/prisma");
    const { SYSTEM_ACCOUNTS } = await import("@/lib/accounting/system-accounts");
    for (const def of Object.values(SYSTEM_ACCOUNTS)) {
      await prisma.account.create({ data: { code: def.code, name: def.name, type: def.type, isSystem: true } });
    }
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");

    const vendor = await createAccount({ code: "V-901", name: "Test Vendor", type: "VENDOR", createdBy: "test" });
    const customer = await createAccount({ code: "C-901", name: "Test Customer", type: "CUSTOMER", createdBy: "test" });

    const bilti = await createBilti({
      biltiNo: "BL-RECON-1",
      truckNo: "RC-001",
      date: new Date("2026-06-01"),
      itemName: "Mango",
      totalCrates: 100,
    });
    const voucher = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: vendor.id, crates: 100 });
    voucherId = voucher.id;
    const lot = await addLot({ voucherId: voucher.id, name: "Lot A", crates: 100, reportRate: toPaisa(1000) });
    await createSale({ lotId: lot.id, date: new Date("2026-06-02"), customerId: customer.id, crates: 100, actualRate: toPaisa(1000), createdBy: "test" });
  });

  afterEach(() => {
    vi.mocked(calculations.computePattiTotals).mockClear();
  });

  it("refuses to post a patti when computePattiTotals returns a netPayable that breaks the identity by even 1 paisa", async () => {
    const { generatePatti, ReconciliationError } = await import("@/lib/services/patti");
    const { prisma } = await import("@/lib/db/prisma");

    vi.mocked(calculations.computePattiTotals).mockImplementationOnce((grossReport, totalExpenses, rate) => {
      const commission = Math.round((grossReport * rate) / 100);
      const correctNetPayable = grossReport - commission - totalExpenses;
      return { grossReport, commission, totalExpenses, netPayable: correctNetPayable + 1 }; // off by exactly 1 paisa
    });

    await expect(generatePatti({ voucherId, createdBy: "test" })).rejects.toThrow(ReconciliationError);

    // Confirm nothing was posted — the transaction rolled back completely.
    const voucher = await prisma.voucher.findUniqueOrThrow({ where: { id: voucherId } });
    expect(voucher.status).toBe("OPEN");
    expect(voucher.pattiNo).toBeNull();

    const pattiEntries = await prisma.journalEntry.findMany({ where: { refType: "PATTI", refId: voucherId } });
    expect(pattiEntries).toHaveLength(0);
  });

  it("posts normally once computePattiTotals is correct again (the check doesn't false-positive on good data)", async () => {
    const { generatePatti } = await import("@/lib/services/patti");
    const { prisma } = await import("@/lib/db/prisma");

    const { pattiNo } = await generatePatti({ voucherId, createdBy: "test" });
    expect(pattiNo).toBeTruthy();

    const voucher = await prisma.voucher.findUniqueOrThrow({ where: { id: voucherId } });
    expect(voucher.status).toBe("COMPLETE");

    const pattiEntries = await prisma.journalEntry.findMany({ where: { refType: "PATTI", refId: voucherId } });
    expect(pattiEntries.length).toBeGreaterThan(0);
  });
});
