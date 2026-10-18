"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCashEntry, payVendorAdvance } from "@/lib/services/cash";
import { toPaisa } from "@/lib/money";
import type { ActionResult } from "./accounts";

const CashEntrySchema = z.object({
  date: z.coerce.date(),
  book: z.enum(["CASH", "WASOOLI"]),
  direction: z.enum(["IN", "OUT"]),
  accountId: z.string().min(1),
  amount: z.coerce.number().positive(),
  mode: z.enum(["CASH", "BANK", "CHEQUE", "ONLINE"]),
  reference: z.string().optional(),
  narration: z.string().optional(),
});

export async function createCashEntryAction(input: z.infer<typeof CashEntrySchema>): Promise<ActionResult> {
  const parsed = CashEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const narrationKey =
      parsed.data.book === "WASOOLI" ? "narration.cashRecovery" : parsed.data.direction === "IN" ? "narration.cashIn" : "narration.cashOut";
    await createCashEntry({ ...parsed.data, narrationKey, amount: toPaisa(parsed.data.amount), createdBy: "owner" });
    revalidatePath("/cash-book");
    revalidatePath("/wasooli");
    revalidatePath("/dashboard");
    revalidatePath("/vendors");
    revalidatePath("/customers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to post entry" };
  }
}

const AdvanceSchema = z.object({
  vendorId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  narration: z.string().optional(),
  mode: z.enum(["CASH", "BANK", "CHEQUE", "ONLINE"]).default("CASH"),
  reference: z.string().optional(),
});

export async function payVendorAdvanceAction(input: z.infer<typeof AdvanceSchema>): Promise<ActionResult> {
  const parsed = AdvanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await payVendorAdvance({ ...parsed.data, amount: toPaisa(parsed.data.amount), createdBy: "owner" });
    revalidatePath("/vendors");
    revalidatePath("/cash-book");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to pay advance" };
  }
}
