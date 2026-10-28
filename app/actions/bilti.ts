"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createBilti, addVoucher, addLot, saveItemDefaultsFromBilti } from "@/lib/services/bilti";
import { toPaisa } from "@/lib/money";
import { requireSessionUser } from "@/lib/auth/session";
import type { ActionResult } from "./accounts";

const BiltiSchema = z.object({
  biltiNo: z.string().min(1),
  truckNo: z.string().min(1),
  date: z.coerce.date(),
  itemName: z.string().min(1),
  totalCrates: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export async function createBiltiAction(input: z.infer<typeof BiltiSchema>): Promise<ActionResult & { id?: string }> {
  try {
    await requireSessionUser();
    const parsed = BiltiSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const bilti = await createBilti(parsed.data);
    revalidatePath("/bilti");
    return { ok: true, id: bilti.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create bilti" };
  }
}

const ExpenseUpdateSchema = z.object({
  id: z.string(),
  basis: z.enum(["PER_CRATE", "TRUCK_TOTAL_SPLIT", "FIXED_PER_VOUCHER"]),
  rate: z.coerce.number().min(0),
  label: z.string().min(1),
});

/** Spec §4.1: Munshi cannot edit the rate card once a patti has been issued; Owner can do everything, so the lock doesn't apply to them. */
export async function updateBiltiExpenseAction(biltiId: string, input: z.infer<typeof ExpenseUpdateSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = ExpenseUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const bilti = await prisma.bilti.findUniqueOrThrow({ where: { id: biltiId }, include: { vouchers: true } });
    if (user.role !== "OWNER" && bilti.vouchers.some((v) => v.status === "COMPLETE")) {
      throw new Error("Rate card cannot be edited once a patti has been issued for a voucher on this bilti");
    }
    await prisma.biltiExpense.update({
      where: { id: parsed.data.id },
      data: { basis: parsed.data.basis, rate: toPaisa(parsed.data.rate), label: parsed.data.label },
    });
    await saveItemDefaultsFromBilti(biltiId);
    revalidatePath(`/bilti/${biltiId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update rate card" };
  }
}

const VoucherSchema = z.object({
  biltiId: z.string(),
  voucherNo: z.string().min(1),
  vendorId: z.string().min(1),
  crates: z.coerce.number().int().positive(),
  kirayaOverride: z.coerce.number().optional(),
});

export async function addVoucherAction(input: z.infer<typeof VoucherSchema>): Promise<ActionResult> {
  try {
    await requireSessionUser();
    const parsed = VoucherSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await addVoucher({
      ...parsed.data,
      kirayaOverride: parsed.data.kirayaOverride != null ? toPaisa(parsed.data.kirayaOverride) : undefined,
    });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add voucher" };
  }
}

const LotSchema = z.object({
  voucherId: z.string(),
  biltiId: z.string(),
  name: z.string().min(1),
  crates: z.coerce.number().int().positive(),
  reportRate: z.coerce.number().positive(),
});

const KirayaOverrideSchema = z.object({
  voucherId: z.string(),
  biltiId: z.string(),
  kirayaOverride: z.coerce.number().min(0).nullable(),
});

export async function updateVoucherKirayaOverrideAction(input: z.infer<typeof KirayaOverrideSchema>): Promise<ActionResult> {
  try {
    await requireSessionUser();
    const parsed = KirayaOverrideSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const voucher = await prisma.voucher.findUniqueOrThrow({ where: { id: parsed.data.voucherId } });
    if (voucher.status === "COMPLETE") throw new Error("This voucher's patti has already been issued");
    await prisma.voucher.update({
      where: { id: parsed.data.voucherId },
      data: { kirayaOverride: parsed.data.kirayaOverride != null ? toPaisa(parsed.data.kirayaOverride) : null },
    });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update kiraya override" };
  }
}

export async function addLotAction(input: z.infer<typeof LotSchema>): Promise<ActionResult> {
  try {
    await requireSessionUser();
    const parsed = LotSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await addLot({ voucherId: parsed.data.voucherId, name: parsed.data.name, crates: parsed.data.crates, reportRate: toPaisa(parsed.data.reportRate) });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add lot" };
  }
}
