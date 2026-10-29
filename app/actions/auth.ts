"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPin, hashPin } from "@/lib/auth/password";
import { createSession, destroySession, requireRole } from "@/lib/auth/session";
import type { ActionResult } from "./accounts";

const LoginSchema = z.object({ userId: z.string().min(1), pin: z.string().min(1) });

export async function loginAction(input: z.infer<typeof LoginSchema>): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || !user.isActive) return { ok: false, error: "accountInactive" };

  const valid = await verifyPin(parsed.data.pin, user.pinHash);
  if (!valid) return { ok: false, error: "wrongPin" };

  await createSession(user.id);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const ChangePinSchema = z.object({ userId: z.string().min(1), newPin: z.string().min(4) });

/** Owner-only: reset another user's PIN (e.g. a forgotten Munshi PIN) without needing the old one. */
export async function resetPinAction(input: z.infer<typeof ChangePinSchema>): Promise<ActionResult> {
  try {
    await requireRole("OWNER");
    const parsed = ChangePinSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const pinHash = await hashPin(parsed.data.newPin);
    await prisma.user.update({ where: { id: parsed.data.userId }, data: { pinHash } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to reset PIN" };
  }
}
