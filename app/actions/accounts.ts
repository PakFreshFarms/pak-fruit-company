"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createAccount, createQuickAccount, deactivateAccount, deleteAccount } from "@/lib/services/accounts";
import { toPaisa } from "@/lib/money";

const AccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameUr: z.string().optional(),
  type: z.enum(["VENDOR", "CUSTOMER", "CASH", "BANK", "EXPENSE", "INCOME", "ASSET", "LIABILITY", "CAPITAL", "FARM"]),
  openingBalance: z.coerce.number().default(0),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createAccountAction(input: z.infer<typeof AccountSchema>): Promise<ActionResult> {
  const parsed = AccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await createAccount({
      ...parsed.data,
      openingBalance: toPaisa(parsed.data.openingBalance),
      createdBy: "owner",
    });
    revalidatePath("/accounts");
    revalidatePath("/vendors");
    revalidatePath("/customers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create account" };
  }
}

const QuickAccountSchema = z.object({
  type: z.enum(["VENDOR", "CUSTOMER"]),
  name: z.string().min(1),
});

export async function createQuickAccountAction(
  input: z.infer<typeof QuickAccountSchema>,
): Promise<ActionResult & { id?: string; code?: string }> {
  const parsed = QuickAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const account = await createQuickAccount(parsed.data.type, parsed.data.name, "owner");
    revalidatePath("/accounts");
    revalidatePath(parsed.data.type === "VENDOR" ? "/vendors" : "/customers");
    return { ok: true, id: account.id, code: account.code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create account" };
  }
}

export async function updateAccountAction(id: string, input: Partial<z.infer<typeof AccountSchema>>): Promise<ActionResult> {
  try {
    await prisma.account.update({
      where: { id },
      data: {
        name: input.name,
        nameUr: input.nameUr,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
      },
    });
    revalidatePath("/accounts");
    revalidatePath("/vendors");
    revalidatePath("/customers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update account" };
  }
}

export async function deactivateAccountAction(id: string): Promise<ActionResult> {
  try {
    await deactivateAccount(id);
    revalidatePath("/accounts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to deactivate account" };
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    await deleteAccount(id);
    revalidatePath("/accounts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete account" };
  }
}
