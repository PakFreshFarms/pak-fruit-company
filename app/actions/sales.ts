"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSale, cancelSaleWithReversal } from "@/lib/services/sales";
import { toPaisa } from "@/lib/money";
import { requireSessionUser } from "@/lib/auth/session";
import type { ActionResult } from "./accounts";

const SaleSchema = z.object({
  lotId: z.string().min(1),
  biltiId: z.string().min(1),
  date: z.coerce.date(),
  customerId: z.string().min(1),
  crates: z.coerce.number().int().positive(),
  actualRate: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export async function createSaleAction(input: z.infer<typeof SaleSchema>): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = SaleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    await createSale({
      lotId: parsed.data.lotId,
      date: parsed.data.date,
      customerId: parsed.data.customerId,
      crates: parsed.data.crates,
      actualRate: toPaisa(parsed.data.actualRate),
      notes: parsed.data.notes,
      createdBy: user.name,
    });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record sale" };
  }
}

export async function deleteSaleAction(saleId: string, biltiId: string): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    await cancelSaleWithReversal(saleId, user.name);
    revalidatePath(`/bilti/${biltiId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to reverse sale" };
  }
}
