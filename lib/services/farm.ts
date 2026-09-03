import { prisma } from "@/lib/db/prisma";
import { postJournal } from "@/lib/journal";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";
import { getCommissionRatePercent } from "@/lib/settings";

export interface CreateFarmExpenseInput {
  farmId: string;
  date: Date;
  head: string;
  payeeName?: string;
  payeeAccountId?: string;
  amount: number;
  narration?: string;
  createdBy: string;
}

/** Dr Farm Expenses (tagged to the farm) / Cr Cash in Hand — daily costs entered as they occur. */
export async function createFarmExpense(input: CreateFarmExpenseInput) {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  return prisma.$transaction(async (tx) => {
    const farmExpenseAccountId = await getSystemAccountId("FARM_EXPENSES", tx);
    const cashAccountId = await getSystemAccountId("CASH_IN_HAND", tx);

    const entry = await postJournal(
      {
        date: input.date,
        refType: "FARM_EXPENSE",
        narration: `${input.head}${input.payeeName ? " — " + input.payeeName : ""}${input.narration ? ": " + input.narration : ""}`,
        createdBy: input.createdBy,
        lines: [
          { accountId: farmExpenseAccountId, debit: input.amount, credit: 0, farmId: input.farmId },
          { accountId: cashAccountId, debit: 0, credit: input.amount },
        ],
      },
      tx,
    );

    return tx.farmExpense.create({
      data: {
        farmId: input.farmId,
        date: input.date,
        head: input.head,
        payeeName: input.payeeName,
        payeeAccountId: input.payeeAccountId,
        amount: input.amount,
        narration: input.narration,
        journalEntryId: entry.id,
      },
    });
  });
}

/** Rent is a farm expense too — posts the same way and increments Farm.rentPaid. */
export async function payFarmRent(input: { farmId: string; amount: number; date: Date; createdBy: string }) {
  return prisma.$transaction(async (tx) => {
    const expense = await createFarmExpense({ ...input, head: "Rent", narration: "Farm rent payment" });
    await tx.farm.update({ where: { id: input.farmId }, data: { rentPaid: { increment: input.amount } } });
    return expense;
  });
}

export interface CreateFarmDispatchInput {
  farmId: string;
  date: Date;
  truckNo: string;
  crates: number;
  marketName?: string;
  chargeCommission?: boolean;
  createdBy: string;
}

/** A dispatch starts PENDING with no journal entry — the fruit hasn't sold yet. */
export async function createFarmDispatch(input: CreateFarmDispatchInput) {
  return prisma.farmDispatch.create({
    data: {
      farmId: input.farmId,
      date: input.date,
      truckNo: input.truckNo,
      crates: input.crates,
      marketName: input.marketName,
      chargeCommission: input.chargeCommission ?? false,
      status: "PENDING",
      netSaleAmount: 0,
    },
  });
}

export interface RecordDispatchSaleInput {
  dispatchId: string;
  netSaleAmount: number;
  createdBy: string;
}

/**
 * When the market sale report comes back: Dr Cash in Hand / Cr Farm Sales
 * Income (tagged to the farm), for the net amount received. If the dispatch
 * has "charge shop commission" ticked, a second entry moves the standard
 * commission rate out of farm income into Commission Income — off by
 * default per spec section 4.7.
 */
export async function recordDispatchSale(input: RecordDispatchSaleInput) {
  if (input.netSaleAmount <= 0) throw new Error("Net sale amount must be greater than zero");
  return prisma.$transaction(async (tx) => {
    const dispatch = await tx.farmDispatch.findUniqueOrThrow({ where: { id: input.dispatchId } });
    if (dispatch.status === "RECEIVED") throw new Error("This dispatch has already been recorded as received");

    const cashAccountId = await getSystemAccountId("CASH_IN_HAND", tx);
    const farmIncomeAccountId = await getSystemAccountId("FARM_INCOME", tx);

    const entry = await postJournal(
      {
        date: new Date(),
        refType: "FARM_SALE",
        refId: dispatch.id,
        narration: `Farm dispatch sale: truck ${dispatch.truckNo}, ${dispatch.crates} crate(s)`,
        createdBy: input.createdBy,
        lines: [
          { accountId: cashAccountId, debit: input.netSaleAmount, credit: 0 },
          { accountId: farmIncomeAccountId, debit: 0, credit: input.netSaleAmount, farmId: dispatch.farmId },
        ],
      },
      tx,
    );

    if (dispatch.chargeCommission) {
      const commissionRate = await getCommissionRatePercent(tx);
      const commission = Math.round((input.netSaleAmount * commissionRate) / 100);
      if (commission > 0) {
        const commissionIncomeId = await getSystemAccountId("COMMISSION_INCOME", tx);
        await postJournal(
          {
            date: new Date(),
            refType: "FARM_SALE",
            refId: dispatch.id,
            narration: `Shop commission on farm dispatch: truck ${dispatch.truckNo}`,
            createdBy: input.createdBy,
            lines: [
              { accountId: farmIncomeAccountId, debit: commission, credit: 0, farmId: dispatch.farmId },
              { accountId: commissionIncomeId, debit: 0, credit: commission },
            ],
          },
          tx,
        );
      }
    }

    return tx.farmDispatch.update({
      where: { id: dispatch.id },
      data: { status: "RECEIVED", netSaleAmount: input.netSaleAmount, journalEntryId: entry.id },
    });
  });
}
