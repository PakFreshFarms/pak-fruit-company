"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generatePatti } from "@/lib/services/patti";
import type { ActionResult } from "./accounts";

const GeneratePattiSchema = z.object({
  voucherId: z.string().min(1),
  biltiId: z.string().min(1),
  closeWithUnsold: z.boolean().optional(),
  closeReason: z.string().optional(),
});

export async function generatePattiAction(input: z.infer<typeof GeneratePattiSchema>): Promise<ActionResult & { pattiNo?: string }> {
  const parsed = GeneratePattiSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const { pattiNo } = await generatePatti({
      voucherId: parsed.data.voucherId,
      createdBy: "owner",
      closeWithUnsold: parsed.data.closeWithUnsold,
      closeReason: parsed.data.closeReason,
    });
    revalidatePath(`/bilti/${parsed.data.biltiId}`);
    revalidatePath("/dashboard");
    revalidatePath("/vendors");
    return { ok: true, pattiNo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate patti" };
  }
}
