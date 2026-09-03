import { prisma } from "@/lib/db/prisma";
import type { Tx } from "@/lib/journal";

export const DEFAULT_COMMISSION_RATE_PERCENT = 10;

export async function getCommissionRatePercent(client: Tx | typeof prisma = prisma): Promise<number> {
  const row = await client.setting.findUnique({ where: { key: "commissionRatePercent" } });
  return row ? Number(row.value) : DEFAULT_COMMISSION_RATE_PERCENT;
}

export async function setSetting(key: string, value: string, client: Tx | typeof prisma = prisma) {
  return client.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getSetting(key: string, fallback = "", client: Tx | typeof prisma = prisma): Promise<string> {
  const row = await client.setting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}
