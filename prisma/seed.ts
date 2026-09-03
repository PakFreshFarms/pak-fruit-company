import { toPaisa } from "../lib/money";
import { SYSTEM_ACCOUNTS } from "../lib/accounting/system-accounts";
import { createAccount } from "../lib/services/accounts";
import { createBilti, addVoucher, addLot } from "../lib/services/bilti";
import { createSale } from "../lib/services/sales";
import { generatePatti } from "../lib/services/patti";
import { setSetting } from "../lib/settings";
import { prisma } from "../lib/db/prisma";

const SEED_USER = "seed";

async function seedSystemAccounts() {
  for (const [, def] of Object.entries(SYSTEM_ACCOUNTS)) {
    await prisma.account.upsert({
      where: { code: def.code },
      update: {},
      create: {
        code: def.code,
        name: def.name,
        nameUr: def.nameUr,
        type: def.type,
        isSystem: true,
        openingBalance: 0,
      },
    });
  }
  console.log(`Seeded ${Object.keys(SYSTEM_ACCOUNTS).length} system accounts`);
}

async function seedOwnerUser() {
  const existing = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (existing) return;
  await prisma.user.create({
    data: { name: "Owner", role: "OWNER", pin: "0000" },
  });
  console.log("Seeded default owner user (PIN 0000 — change this in Settings)");
}

async function seedSettings() {
  await setSetting("commissionRatePercent", "10");
  await setSetting("shopName", "Pak Fruit Company");
  await setSetting("shopAddress", "Fruit Market, Lahore");
}

async function seedSampleBilti() {
  const existing = await prisma.bilti.findUnique({ where: { biltiNo: "BL-101" } });
  if (existing) {
    console.log("Sample bilti BL-101 already exists, skipping");
    return;
  }

  const ahmed = await createAccount({
    code: "V-001",
    name: "Ahmed",
    type: "VENDOR",
    phone: "0300-0000001",
    createdBy: SEED_USER,
  });
  const shazia = await createAccount({
    code: "V-002",
    name: "Shazia",
    type: "VENDOR",
    phone: "0300-0000002",
    createdBy: SEED_USER,
  });
  const hayyan = await createAccount({
    code: "C-001",
    name: "Hayyan Ali",
    type: "CUSTOMER",
    phone: "0300-0000101",
    createdBy: SEED_USER,
  });
  const bilal = await createAccount({
    code: "C-002",
    name: "Bilal Traders",
    type: "CUSTOMER",
    phone: "0300-0000102",
    createdBy: SEED_USER,
  });

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
    await prisma.biltiExpense.update({ where: { id: exp.id }, data: { rate: rates[exp.head] ?? 0 } });
  }

  const voucher23 = await addVoucher({ biltiId: bilti.id, voucherNo: "23", vendorId: ahmed.id, crates: 300 });
  const voucher24 = await addVoucher({ biltiId: bilti.id, voucherNo: "24", vendorId: shazia.id, crates: 700 });

  const lotA = await addLot({ voucherId: voucher23.id, name: "Mosami Chaunsa International", crates: 100, reportRate: toPaisa(1200) });
  const lotB = await addLot({ voucherId: voucher23.id, name: "Mosami Chaunsa", crates: 200, reportRate: toPaisa(900) });

  // Worked example from the spec (section 6.7): 30 crates sold below report rate.
  await createSale({
    lotId: lotA.id,
    date: new Date("2026-05-02"),
    customerId: hayyan.id,
    crates: 30,
    actualRate: toPaisa(1100),
    createdBy: SEED_USER,
  });
  // Remainder of lot A sells at report rate (no concession, no premium).
  await createSale({
    lotId: lotA.id,
    date: new Date("2026-05-02"),
    customerId: bilal.id,
    crates: 70,
    actualRate: toPaisa(1200),
    createdBy: SEED_USER,
  });
  // Lot B sells fully at report rate.
  await createSale({
    lotId: lotB.id,
    date: new Date("2026-05-03"),
    customerId: bilal.id,
    crates: 200,
    actualRate: toPaisa(900),
    createdBy: SEED_USER,
  });

  const { totals, pattiNo } = await generatePatti({ voucherId: voucher23.id, createdBy: SEED_USER });
  console.log(
    `Generated ${pattiNo} for voucher 23 (Ahmed): gross ${totals.grossReport / 100}, commission ${totals.commission / 100}, expenses ${totals.totalExpenses / 100}, net payable ${totals.netPayable / 100}`,
  );

  // Shazia's voucher is left open on purpose — it shows up under "vouchers awaiting patti" on the dashboard.
  await addLot({ voucherId: voucher24.id, name: "Mosami Chaunsa", crates: 700, reportRate: toPaisa(950) });

  console.log("Seeded sample bilti BL-101 with two vouchers");
}

async function main() {
  await seedSystemAccounts();
  await seedOwnerUser();
  await seedSettings();
  await seedSampleBilti();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
