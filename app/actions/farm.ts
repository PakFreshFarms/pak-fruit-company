"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createFarmExpense, createFarmDispatch, recordDispatchSale, payFarmRent } from "@/lib/services/farm";
import { toPaisa } from "@/lib/money";
import { requireSessionUser, requireRole } from "@/lib/auth/session";
import type { ActionResult } from "./accounts";

const FarmSchema = z.object({
  name: z.string().min(1),
  season: z.string().min(1),
  landownerName: z.string().min(1),
  rentAmount: z.coerce.number().min(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export async function createFarmAction(input: z.infer<typeof FarmSchema>): Promise<ActionResult & { id?: string }> {
  try {
    await requireSessionUser();
    const parsed = FarmSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const farm = await prisma.farm.create({
      data: { ...parsed.data, rentAmount: toPaisa(parsed.data.rentAmount) },
    });
    revalidatePath("/farms");
    return { ok: true, id: farm.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create farm" };
  }
}

/** Spec §4.1: "Munshi ... cannot ... close a season ... Owner can do everything." There was previously no action anywhere that ever set Farm.isClosed — the field existed but nothing ever wrote to it. */
export async function closeFarmSeasonAction(farmId: string): Promise<ActionResult> {
  try {
    const user = await requireRole("OWNER");
    const farm = await prisma.farm.findUniqueOrThrow({ where: { id: farmId } });
    if (farm.isClosed) throw new Error("This season is already closed");
    await prisma.farm.update({ where: { id: farmId }, data: { isClosed: true, closedAt: new Date(), closedBy: user.name } });
    revalidatePath(`/farms/${farmId}`);
    revalidatePath("/farms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to close season" };
  }
}

const FarmExpenseSchema = z.object({
  farmId: z.string().min(1),
  date: z.coerce.date(),
  head: z.string().min(1),
  payeeName: z.string().optional(),
  amount: z.coerce.number().positive(),
  narration: z.string().optional(),
});

export async function createFarmExpenseAction(input: z.infer<typeof FarmExpenseSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = FarmExpenseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await createFarmExpense({ ...parsed.data, amount: toPaisa(parsed.data.amount), createdBy: user.name });
    revalidatePath(`/farms/${parsed.data.farmId}`);
    revalidatePath("/farms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record expense" };
  }
}

const BatchExpenseSchema = z.object({
  farmId: z.string().min(1),
  date: z.coerce.date(),
  head: z.string().min(1),
  lines: z.array(z.object({ payeeName: z.string().min(1), amount: z.coerce.number().positive() })).min(1),
});

export async function createFarmExpenseBatchAction(input: z.infer<typeof BatchExpenseSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = BatchExpenseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    for (const line of parsed.data.lines) {
      await createFarmExpense({
        farmId: parsed.data.farmId,
        date: parsed.data.date,
        head: parsed.data.head,
        payeeName: line.payeeName,
        amount: toPaisa(line.amount),
        createdBy: user.name,
      });
    }
    revalidatePath(`/farms/${parsed.data.farmId}`);
    revalidatePath("/farms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record expenses" };
  }
}

const RentSchema = z.object({ farmId: z.string().min(1), amount: z.coerce.number().positive(), date: z.coerce.date() });

export async function payFarmRentAction(input: z.infer<typeof RentSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = RentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await payFarmRent({ ...parsed.data, amount: toPaisa(parsed.data.amount), createdBy: user.name });
    revalidatePath(`/farms/${parsed.data.farmId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record rent" };
  }
}

const DispatchSchema = z.object({
  farmId: z.string().min(1),
  date: z.coerce.date(),
  truckNo: z.string().min(1),
  crates: z.coerce.number().int().positive(),
  marketName: z.string().optional(),
  chargeCommission: z.boolean().optional(),
});

export async function createFarmDispatchAction(input: z.infer<typeof DispatchSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = DispatchSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await createFarmDispatch({ ...parsed.data, createdBy: user.name });
    revalidatePath(`/farms/${parsed.data.farmId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create dispatch" };
  }
}

const RecordSaleSchema = z.object({ dispatchId: z.string().min(1), farmId: z.string().min(1), netSaleAmount: z.coerce.number().positive() });

export async function recordDispatchSaleAction(input: z.infer<typeof RecordSaleSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = RecordSaleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await recordDispatchSale({ dispatchId: parsed.data.dispatchId, netSaleAmount: toPaisa(parsed.data.netSaleAmount), createdBy: user.name });
    revalidatePath(`/farms/${parsed.data.farmId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record sale" };
  }
}
