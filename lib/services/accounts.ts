import { prisma } from "@/lib/db/prisma";
import { postJournal } from "@/lib/journal";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";
import type { AccountType } from "@prisma/client";

export interface CreateAccountInput {
  code: string;
  name: string;
  nameUr?: string;
  type: AccountType;
  openingBalance?: number;
  phone?: string;
  address?: string;
  notes?: string;
  createdBy: string;
}

/**
 * Creates an account and, if it carries an opening balance, posts an OPENING
 * journal entry against Capital so the balance is derived from JournalLine
 * like everything else rather than living only in the openingBalance column
 * (that column is kept for display/audit of what was originally entered).
 */
export async function createAccount(input: CreateAccountInput) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        code: input.code,
        name: input.name,
        nameUr: input.nameUr,
        type: input.type,
        openingBalance: input.openingBalance ?? 0,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
      },
    });

    if (input.openingBalance) {
      const capitalId = await getSystemAccountId("CAPITAL", tx);
      const amount = Math.abs(input.openingBalance);
      const lines =
        input.openingBalance > 0
          ? [
              { accountId: account.id, debit: amount, credit: 0 },
              { accountId: capitalId, debit: 0, credit: amount },
            ]
          : [
              { accountId: capitalId, debit: amount, credit: 0 },
              { accountId: account.id, debit: 0, credit: amount },
            ];
      await postJournal(
        {
          date: new Date(),
          refType: "OPENING",
          refId: account.id,
          narration: `Opening balance: ${input.name}`,
          narrationKey: "narration.openingBalance",
          narrationParams: { accountName: input.name },
          createdBy: input.createdBy,
          lines,
        },
        tx,
      );
    }

    return account;
  });
}

async function nextAccountCode(type: "VENDOR" | "CUSTOMER") {
  const prefix = type === "VENDOR" ? "V-" : "C-";
  const accounts = await prisma.account.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } });
  let max = 0;
  for (const a of accounts) {
    const n = parseInt(a.code.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/**
 * Quick-add used by the inline "create new customer/vendor" option in the
 * sale-entry combobox — a munshi meeting a new buyer mid-sale shouldn't have
 * to leave the screen to think up an account code. Code is auto-generated;
 * everything else (phone, address) can be filled in later from Account Heads.
 */
export async function createQuickAccount(type: "VENDOR" | "CUSTOMER", name: string, createdBy: string) {
  const code = await nextAccountCode(type);
  return createAccount({ code, name, type, createdBy });
}

export async function deactivateAccount(accountId: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (account.isSystem) throw new Error("System accounts cannot be deactivated or deleted");
  return prisma.account.update({ where: { id: accountId }, data: { isActive: false } });
}

export async function deleteAccount(accountId: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (account.isSystem) throw new Error("System accounts cannot be deleted");
  const lineCount = await prisma.journalLine.count({ where: { accountId } });
  if (lineCount > 0) throw new Error("This account has posted transactions and cannot be deleted — deactivate it instead");
  return prisma.account.delete({ where: { id: accountId } });
}
