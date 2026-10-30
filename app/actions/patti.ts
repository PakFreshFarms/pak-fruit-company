"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generatePatti } from "@/lib/services/patti";
import { requireSessionUser } from "@/lib/auth/session";
import type { ActionResult } from "./accounts";

const GeneratePattiSchema = z.object({
  voucherId: z.string().min(1),
  biltiId: z.string().min(1),
});

/** "Save Voucher" in the UI — only reachable once a voucher is 100% sold; there is no override for partial completion (spec: a voucher is complete only when its full crate quantity has been sold). */
export async function generatePattiAction(input: z.infer<typeof GeneratePattiSchema>): Promise<ActionResult & { pattiNo?: string }> {
  try {
    const user = await requireSessionUser();
    const parsed = GeneratePattiSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { pattiNo } = await generatePatti({
      voucherId: parsed.data.voucherId,
      createdBy: user.name,
    });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    revalidatePath("/bilti");
    revalidatePath("/dashboard");
    revalidatePath("/home");
    revalidatePath("/vendors");
    return { ok: true, pattiNo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate patti" };
  }
}
