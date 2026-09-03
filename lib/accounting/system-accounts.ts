import { prisma } from "@/lib/db/prisma";
import type { Tx } from "@/lib/journal";
import type { AccountType } from "@prisma/client";

export const SYSTEM_ACCOUNTS = {
  CASH_IN_HAND: { code: "SYS-CASH", name: "Cash in Hand", nameUr: "نقد دستیاب", type: "CASH" as AccountType },
  COMMISSION_INCOME: { code: "SYS-COMM", name: "Commission Income", nameUr: "کمیشن آمدنی", type: "INCOME" as AccountType },
  RATE_DIFFERENCE: { code: "SYS-RATEDIFF", name: "Rate Difference", nameUr: "ریٹ فرق", type: "INCOME" as AccountType },
  BILTI_EXPENSE_RECOVERY: { code: "SYS-EXPRECOVERY", name: "Bilti Expense Recovery", nameUr: "بلٹی اخراجات وصولی", type: "INCOME" as AccountType },
  KIRAYA_PAID: { code: "SYS-EXP-KIRAYA", name: "Kiraya Paid", nameUr: "کرایہ ادا شدہ", type: "EXPENSE" as AccountType },
  MAZDOORI_PAID: { code: "SYS-EXP-MAZDOORI", name: "Mazdoori Paid", nameUr: "مزدوری ادا شدہ", type: "EXPENSE" as AccountType },
  MUNSHIYANA_PAID: { code: "SYS-EXP-MUNSHIYANA", name: "Munshiyana Paid", nameUr: "منشیانہ ادا شدہ", type: "EXPENSE" as AccountType },
  DAAK_PAID: { code: "SYS-EXP-DAAK", name: "Daak Paid", nameUr: "ڈاک ادا شدہ", type: "EXPENSE" as AccountType },
  BARDANA_PAID: { code: "SYS-EXP-BARDANA", name: "Bardana Paid", nameUr: "بردانہ ادا شدہ", type: "EXPENSE" as AccountType },
  PESHGI_PAID: { code: "SYS-EXP-PESHGI", name: "Peshgi Paid", nameUr: "پیشگی ادا شدہ", type: "EXPENSE" as AccountType },
  VENDOR_ADVANCES: { code: "SYS-VENDORADV", name: "Vendor Advances", nameUr: "کاشتکار ایڈوانس", type: "ASSET" as AccountType },
  SHOP_EXPENSES: { code: "SYS-SHOPEXP", name: "Shop Expenses", nameUr: "دکان اخراجات", type: "EXPENSE" as AccountType },
  CAPITAL: { code: "SYS-CAPITAL", name: "Capital", nameUr: "سرمایہ", type: "CAPITAL" as AccountType },
  // Not named explicitly in the client's chart of accounts (section 4.1) but
  // required so farm cost-centre postings stay real double-entry rather than
  // landing in the unrelated Shop Expenses head. Tagged per-farm via
  // JournalLine.farmId, and the FarmExpense.head string carries the
  // Mazdoori/Spray/Khaad/etc. breakdown for reporting.
  FARM_EXPENSES: { code: "SYS-FARMEXP", name: "Farm Expenses", nameUr: "فارم اخراجات", type: "EXPENSE" as AccountType },
  FARM_INCOME: { code: "SYS-FARMINCOME", name: "Farm Sales Income", nameUr: "فارم فروخت آمدنی", type: "INCOME" as AccountType },
} as const;

export type SystemAccountKey = keyof typeof SYSTEM_ACCOUNTS;

const cache = new Map<string, string>();

export async function getSystemAccountId(key: SystemAccountKey, client: Tx | typeof prisma = prisma): Promise<string> {
  const def = SYSTEM_ACCOUNTS[key];
  const cacheKey = def.code;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const account = await client.account.findUniqueOrThrow({ where: { code: def.code } });
  cache.set(cacheKey, account.id);
  return account.id;
}

/** Head string on BiltiExpense/FarmExpense -> the "...Paid" expense account key. */
export const EXPENSE_HEAD_TO_ACCOUNT: Record<string, SystemAccountKey> = {
  KIRAYA: "KIRAYA_PAID",
  MAZDOORI: "MAZDOORI_PAID",
  MUNSHIYANA: "MUNSHIYANA_PAID",
  DAAK: "DAAK_PAID",
  BARDANA: "BARDANA_PAID",
  PESHGI: "PESHGI_PAID",
};
