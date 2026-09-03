import { prisma } from "@/lib/db/prisma";
import type { ExpenseBasis } from "@prisma/client";
import { EXPENSE_HEAD_TO_ACCOUNT, getSystemAccountId } from "@/lib/accounting/system-accounts";

export interface DefaultRate {
  head: string;
  label: string;
  basis: ExpenseBasis;
  rate: number;
}

const HEAD_DEFAULTS: DefaultRate[] = [
  { head: "KIRAYA", label: "Kiraya", basis: "PER_CRATE", rate: 0 },
  { head: "MAZDOORI", label: "Mazdoori", basis: "PER_CRATE", rate: 0 },
  { head: "MUNSHIYANA", label: "Munshiyana", basis: "TRUCK_TOTAL_SPLIT", rate: 0 },
  { head: "DAAK", label: "Daak", basis: "TRUCK_TOTAL_SPLIT", rate: 0 },
  { head: "BARDANA", label: "Bardana", basis: "TRUCK_TOTAL_SPLIT", rate: 0 },
  { head: "PESHGI", label: "Peshgi", basis: "TRUCK_TOTAL_SPLIT", rate: 0 },
];

/** Bilti creation posts no journal entry — the goods aren't owned (rule 5.2). Pre-fills the rate card from this item's last-used rates when available, else the stock defaults. */
export async function createBilti(input: {
  biltiNo: string;
  truckNo: string;
  date: Date;
  itemName: string;
  totalCrates: number;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const bilti = await tx.bilti.create({
      data: {
        biltiNo: input.biltiNo,
        truckNo: input.truckNo,
        date: input.date,
        itemName: input.itemName,
        totalCrates: input.totalCrates,
        notes: input.notes,
      },
    });

    const itemDefaults = await tx.itemExpenseDefault.findMany({ where: { itemName: input.itemName } });
    const bases = itemDefaults.length > 0 ? itemDefaults : HEAD_DEFAULTS.map((d) => ({ ...d, id: "", itemName: input.itemName }));

    for (const d of bases) {
      const accountKey = EXPENSE_HEAD_TO_ACCOUNT[d.head] ?? "SHOP_EXPENSES";
      const expenseAccountId = await getSystemAccountId(accountKey, tx);
      await tx.biltiExpense.create({
        data: {
          biltiId: bilti.id,
          head: d.head,
          label: d.label,
          basis: d.basis,
          rate: d.rate,
          expenseAccountId,
        },
      });
    }

    return tx.bilti.findUniqueOrThrow({ where: { id: bilti.id }, include: { expenses: true } });
  });
}

/** Remembers this bilti's rates as the default for the item, so the next bilti of the same fruit pre-fills sensibly. */
export async function saveItemDefaultsFromBilti(biltiId: string) {
  const bilti = await prisma.bilti.findUniqueOrThrow({ where: { id: biltiId }, include: { expenses: true } });
  for (const exp of bilti.expenses) {
    await prisma.itemExpenseDefault.upsert({
      where: { itemName_head: { itemName: bilti.itemName, head: exp.head } },
      update: { label: exp.label, basis: exp.basis, rate: exp.rate },
      create: { itemName: bilti.itemName, head: exp.head, label: exp.label, basis: exp.basis, rate: exp.rate },
    });
  }
}

export async function addVoucher(input: { biltiId: string; voucherNo: string; vendorId: string; crates: number; kirayaOverride?: number }) {
  const bilti = await prisma.bilti.findUniqueOrThrow({ where: { id: input.biltiId }, include: { vouchers: true } });
  const assigned = bilti.vouchers.reduce((s, v) => s + v.crates, 0);
  if (assigned + input.crates > bilti.totalCrates) {
    throw new Error(`Only ${bilti.totalCrates - assigned} crate(s) remain unassigned on this bilti`);
  }
  return prisma.voucher.create({
    data: {
      biltiId: input.biltiId,
      voucherNo: input.voucherNo,
      vendorId: input.vendorId,
      crates: input.crates,
      kirayaOverride: input.kirayaOverride,
    },
  });
}

export async function addLot(input: { voucherId: string; name: string; crates: number; reportRate: number }) {
  const voucher = await prisma.voucher.findUniqueOrThrow({ where: { id: input.voucherId }, include: { lots: true } });
  const assigned = voucher.lots.reduce((s, l) => s + l.crates, 0);
  if (assigned + input.crates > voucher.crates) {
    throw new Error(`Only ${voucher.crates - assigned} crate(s) remain unassigned on this voucher`);
  }
  return prisma.lot.create({
    data: { voucherId: input.voucherId, name: input.name, crates: input.crates, reportRate: input.reportRate },
  });
}
