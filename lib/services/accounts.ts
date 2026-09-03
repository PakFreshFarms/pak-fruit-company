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
          createdBy: input.createdBy,
          lines,
        },
        tx,
      );
    }

    return account;
  });
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
