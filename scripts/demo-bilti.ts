// One-off demo script: creates a full end-to-end bilti with two vendors,
// lots, and sales at differing report/actual rates, then generates both
// pattis. Run with: npx tsx scripts/demo-bilti.ts
// Not part of the seed script — this is just for a live walkthrough.

import { toPaisa } from "../lib/money";
import { createAccount } from "../lib/services/accounts";
import { createBilti, addVoucher, addLot } from "../lib/services/bilti";
import { createSale } from "../lib/services/sales";
import { generatePatti } from "../lib/services/patti";
import { prisma } from "../lib/db/prisma";

const USER = "demo";

async function main() {
  const existing = await prisma.bilti.findUnique({ where: { biltiNo: "BL-102" } });
  if (existing) {
    console.log("BL-102 already exists — id:", existing.id);
    return existing.id;
  }

  const imran = await createAccount({ code: "V-101", name: "Imran", type: "VENDOR", phone: "0301-1111111", createdBy: USER });
  const fatima = await createAccount({ code: "V-102", name: "Fatima", type: "VENDOR", phone: "0301-2222222", createdBy: USER });
  const zafar = await createAccount({ code: "C-101", name: "Zafar Traders", type: "CUSTOMER", phone: "0301-3333333", createdBy: USER });
  const noor = await createAccount({ code: "C-102", name: "Noor Fruit Mart", type: "CUSTOMER", phone: "0301-4444444", createdBy: USER });

  const bilti = await createBilti({
    biltiNo: "BL-102",
    truckNo: "XYZ-789",
    date: new Date(),
    itemName: "Kinnow",
    totalCrates: 500,
  });

  const rates: Record<string, number> = {
    KIRAYA: toPaisa(50),
    MAZDOORI: toPaisa(8),
    MUNSHIYANA: toPaisa(2000),
    DAAK: toPaisa(1500),
    BARDANA: toPaisa(4000),
    PESHGI: toPaisa(1000),
  };
  for (const exp of bilti.expenses) {
    await prisma.biltiExpense.update({ where: { id: exp.id }, data: { rate: rates[exp.head] ?? 0 } });
  }

  // Voucher 1 — Imran, 200 crates
  const v1 = await addVoucher({ biltiId: bilti.id, voucherNo: "1", vendorId: imran.id, crates: 200 });
  const lot1 = await addLot({ voucherId: v1.id, name: "Kinnow A-Grade", crates: 200, reportRate: toPaisa(600) });
  // Sold above report rate (client keeps the difference)
  await createSale({ lotId: lot1.id, date: new Date(), customerId: zafar.id, crates: 120, actualRate: toPaisa(650), createdBy: USER });
  // Sold below report rate (client absorbs a concession)
  await createSale({ lotId: lot1.id, date: new Date(), customerId: zafar.id, crates: 80, actualRate: toPaisa(580), createdBy: USER });

  // Voucher 2 — Fatima, 300 crates
  const v2 = await addVoucher({ biltiId: bilti.id, voucherNo: "2", vendorId: fatima.id, crates: 300 });
  const lot2 = await addLot({ voucherId: v2.id, name: "Kinnow B-Grade", crates: 300, reportRate: toPaisa(500) });
  await createSale({ lotId: lot2.id, date: new Date(), customerId: noor.id, crates: 300, actualRate: toPaisa(520), createdBy: USER });

  const p1 = await generatePatti({ voucherId: v1.id, createdBy: USER });
  const p2 = await generatePatti({ voucherId: v2.id, createdBy: USER });

  console.log("Bilti:", bilti.id);
  console.log("Voucher 1 (Imran):", v1.id, p1.pattiNo, p1.totals);
  console.log("Voucher 2 (Fatima):", v2.id, p2.pattiNo, p2.totals);

  return bilti.id;
}

main()
  .then((id) => console.log("DONE. Bilti id:", id))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
