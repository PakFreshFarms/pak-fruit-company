"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { setSetting } from "@/lib/settings";
import { createBackup, restoreFromBuffer } from "@/lib/services/backup";
import type { ActionResult } from "./accounts";

const SettingsSchema = z.object({
  shopName: z.string().min(1),
  shopAddress: z.string().optional(),
  commissionRatePercent: z.coerce.number().min(0).max(100),
  financialYear: z.string().optional(),
});

export async function updateSettingsAction(input: z.infer<typeof SettingsSchema>): Promise<ActionResult> {
  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await setSetting("shopName", parsed.data.shopName);
    await setSetting("shopAddress", parsed.data.shopAddress ?? "");
    await setSetting("commissionRatePercent", String(parsed.data.commissionRatePercent));
    await setSetting("financialYear", parsed.data.financialYear ?? "");
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }
}

const UserSchema = z.object({ name: z.string().min(1), role: z.enum(["OWNER", "MUNSHI"]), pin: z.string().min(4) });

export async function createUserAction(input: z.infer<typeof UserSchema>): Promise<ActionResult> {
  const parsed = UserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await prisma.user.create({ data: parsed.data });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create user" };
  }
}

export async function backupNowAction(): Promise<ActionResult> {
  try {
    await createBackup(false);
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Backup failed" };
  }
}

export async function restoreAction(formData: FormData): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");
    const buffer = Buffer.from(await file.arrayBuffer());
    await restoreFromBuffer(buffer);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Restore failed" };
  }
}
