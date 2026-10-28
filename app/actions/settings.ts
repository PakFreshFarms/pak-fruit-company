"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { setSetting } from "@/lib/settings";
import { createBackup, restoreFromBuffer } from "@/lib/services/backup";
import { requireRole } from "@/lib/auth/session";
import { hashPin } from "@/lib/auth/password";
import type { ActionResult } from "./accounts";

const SettingsSchema = z.object({
  shopName: z.string().min(1),
  shopAddress: z.string().optional(),
  commissionRatePercent: z.coerce.number().min(0).max(100),
  financialYear: z.string().optional(),
});

/** Settings, Users, and Backup/Restore are all treated as Owner-only administrative capability — the spec names "delete accounts / close a season / edit rate card after a patti" as Munshi's explicit restrictions, but leaving user creation (privilege escalation) or restoring the whole database open to Munshi would undermine the point of having roles at all. */
export async function updateSettingsAction(input: z.infer<typeof SettingsSchema>): Promise<ActionResult> {
  try {
    await requireRole("OWNER");
    const parsed = SettingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  try {
    await requireRole("OWNER");
    const parsed = UserSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const pinHash = await hashPin(parsed.data.pin);
    await prisma.user.create({ data: { name: parsed.data.name, role: parsed.data.role, pinHash } });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create user" };
  }
}

export async function backupNowAction(): Promise<ActionResult> {
  try {
    await requireRole("OWNER");
    await createBackup(false);
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Backup failed" };
  }
}

export async function restoreAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("OWNER");
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");
    const buffer = Buffer.from(await file.arrayBuffer());
    await restoreFromBuffer(buffer);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Restore failed" };
  }
}
