// Proves the §4 completion rule actually blocks a patti for a partially-sold
// voucher, and that it accounts for crates never even split into a lot (not
// just lots that are themselves partially sold) — this round removed the
// "close with unsold crates" override entirely, so generatePatti must now
// refuse unconditionally whenever any crates remain unsold, in both shapes.
// It also proves a bilti only flips to COMPLETE once every voucher is
// COMPLETE and the bilti's full crate count has actually been sold, not
// merely "every voucher that exists happens to be complete."
import { beforeAll, describe, expect, it } from "vitest";
import { resetTestDatabase } from "./setup";
import { toPaisa } from "@/lib/money";

describe("voucher/bilti completion rules (no partial-completion override)", () => {
  beforeAll(async () => {
    resetTestDatabase("voucher-completion");
    const { prisma } = await import("@/lib/db/prisma");
    const { SYSTEM_ACCOUNTS } = await import("@/lib/accounting/system-accounts");
    for (const def of Object.values(SYSTEM_ACCOUNTS)) {
      await prisma.account.create({ data: { code: def.code, name: def.name, type: def.type, isSystem: true } });
    }
  });

  it("refuses to generate a patti when a lot exists but is only partially sold", async () => {
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");
    const { generatePatti, VoucherNotFullySoldError } = await import("@/lib/services/patti");

    const vendor = await createAccount({ code: "V-910", name: "Vendor Partial Lot", type: "VENDOR", createdBy: "test" });
    const customer = await createAccount({ code: "C-910", name: "Customer Partial Lot", type: "CUSTOMER", createdBy: "test" });

    const bilti = await createBilti({ biltiNo: "BL-COMP-1", truckNo: "CP-001", date: new Date("2026-06-01"), itemName: "Mango", totalCrates: 100 });
    const voucher = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: vendor.id, crates: 100 });
    const lot = await addLot({ voucherId: voucher.id, name: "Lot A", crates: 100, reportRate: toPaisa(1000) });
    // Only 60 of the lot's 100 crates sold.
    await createSale({ lotId: lot.id, date: new Date("2026-06-02"), customerId: customer.id, crates: 60, actualRate: toPaisa(1000), createdBy: "test" });

    await expect(generatePatti({ voucherId: voucher.id, createdBy: "test" })).rejects.toThrow(VoucherNotFullySoldError);

    const { prisma } = await import("@/lib/db/prisma");
    const reloaded = await prisma.voucher.findUniqueOrThrow({ where: { id: voucher.id } });
    expect(reloaded.status).toBe("OPEN");
    expect(reloaded.pattiNo).toBeNull();
  });

  it("refuses to generate a patti when crates were never split into any lot at all (the precision bug this round fixed)", async () => {
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");
    const { generatePatti, VoucherNotFullySoldError } = await import("@/lib/services/patti");

    const vendor = await createAccount({ code: "V-911", name: "Vendor Unassigned Crates", type: "VENDOR", createdBy: "test" });
    const customer = await createAccount({ code: "C-911", name: "Customer Unassigned Crates", type: "CUSTOMER", createdBy: "test" });

    const bilti = await createBilti({ biltiNo: "BL-COMP-2", truckNo: "CP-002", date: new Date("2026-06-01"), itemName: "Mango", totalCrates: 100 });
    // Voucher claims 100 crates, but only a 70-crate lot is ever created and
    // fully sold out — the other 30 crates were never split into any lot.
    // The old "sum shortfall across existing lots" calculation would see the
    // one lot as 100% sold and wrongly allow the patti; the fix must compare
    // against the voucher's own crate count instead.
    const voucher = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: vendor.id, crates: 100 });
    const lot = await addLot({ voucherId: voucher.id, name: "Lot A", crates: 70, reportRate: toPaisa(1000) });
    await createSale({ lotId: lot.id, date: new Date("2026-06-02"), customerId: customer.id, crates: 70, actualRate: toPaisa(1000), createdBy: "test" });

    await expect(generatePatti({ voucherId: voucher.id, createdBy: "test" })).rejects.toThrow(VoucherNotFullySoldError);

    const { prisma } = await import("@/lib/db/prisma");
    const reloaded = await prisma.voucher.findUniqueOrThrow({ where: { id: voucher.id } });
    expect(reloaded.status).toBe("OPEN");
  });

  it("posts the patti once the voucher's full crate quantity is sold, and only then", async () => {
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");
    const { generatePatti } = await import("@/lib/services/patti");
    const { prisma } = await import("@/lib/db/prisma");

    const vendor = await createAccount({ code: "V-912", name: "Vendor Full Sale", type: "VENDOR", createdBy: "test" });
    const customer = await createAccount({ code: "C-912", name: "Customer Full Sale", type: "CUSTOMER", createdBy: "test" });

    const bilti = await createBilti({ biltiNo: "BL-COMP-3", truckNo: "CP-003", date: new Date("2026-06-01"), itemName: "Mango", totalCrates: 50 });
    const voucher = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: vendor.id, crates: 50 });
    const lot = await addLot({ voucherId: voucher.id, name: "Lot A", crates: 50, reportRate: toPaisa(1000) });
    await createSale({ lotId: lot.id, date: new Date("2026-06-02"), customerId: customer.id, crates: 50, actualRate: toPaisa(1000), createdBy: "test" });

    const { voucher: completed, pattiNo } = await generatePatti({ voucherId: voucher.id, createdBy: "test" });
    expect(completed.status).toBe("COMPLETE");
    expect(pattiNo).toBeTruthy();

    const reloadedBilti = await prisma.bilti.findUniqueOrThrow({ where: { id: bilti.id } });
    expect(reloadedBilti.status).toBe("COMPLETE");
  });

  it("does not mark the bilti COMPLETE when a second voucher still holds unassigned bilti crates", async () => {
    const { createAccount } = await import("@/lib/services/accounts");
    const { createBilti, addVoucher, addLot } = await import("@/lib/services/bilti");
    const { createSale } = await import("@/lib/services/sales");
    const { generatePatti } = await import("@/lib/services/patti");
    const { prisma } = await import("@/lib/db/prisma");

    const vendor = await createAccount({ code: "V-913", name: "Vendor Two Vouchers", type: "VENDOR", createdBy: "test" });
    const customer = await createAccount({ code: "C-913", name: "Customer Two Vouchers", type: "CUSTOMER", createdBy: "test" });

    // Bilti has 100 crates total, but only one 60-crate voucher is ever
    // created and fully sold — the other 40 crates are never assigned to any
    // voucher. "Every voucher that exists is complete" must not be enough.
    const bilti = await createBilti({ biltiNo: "BL-COMP-4", truckNo: "CP-004", date: new Date("2026-06-01"), itemName: "Mango", totalCrates: 100 });
    const voucher = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: vendor.id, crates: 60 });
    const lot = await addLot({ voucherId: voucher.id, name: "Lot A", crates: 60, reportRate: toPaisa(1000) });
    await createSale({ lotId: lot.id, date: new Date("2026-06-02"), customerId: customer.id, crates: 60, actualRate: toPaisa(1000), createdBy: "test" });

    await generatePatti({ voucherId: voucher.id, createdBy: "test" });

    const reloadedBilti = await prisma.bilti.findUniqueOrThrow({ where: { id: bilti.id } });
    expect(reloadedBilti.status).toBe("OPEN");
  });
});
