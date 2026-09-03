import { prisma } from "@/lib/db/prisma";
import { differenceInCalendarDays } from "date-fns";

export interface AgeingBuckets {
  b0_7: number;
  b8_15: number;
  b16_30: number;
  b30plus: number;
  total: number;
}

function emptyBuckets(): AgeingBuckets {
  return { b0_7: 0, b8_15: 0, b16_30: 0, b30plus: 0, total: 0 };
}

function bucketFor(ageDays: number): keyof Omit<AgeingBuckets, "total"> {
  if (ageDays <= 7) return "b0_7";
  if (ageDays <= 15) return "b8_15";
  if (ageDays <= 30) return "b16_30";
  return "b30plus";
}

/**
 * FIFO ageing: each customer's debit lines (sales) are consumed oldest-first
 * by their credit lines (wasooli recoveries). What remains unconsumed on
 * each debit line, dated by that sale's own date, is bucketed by age. This
 * gives a real invoice-style ageing rather than just a single balance
 * figure — the market credit turnover the client asked for in section 7.6.
 */
export async function getCustomerAgeing(customerId: string, asOf: Date = new Date()): Promise<AgeingBuckets> {
  const lines = await prisma.journalLine.findMany({
    where: { accountId: customerId, entry: { isReversed: false } },
    include: { entry: true },
    orderBy: [{ entry: { date: "asc" } }, { entry: { createdAt: "asc" } }],
  });

  const debits = lines.filter((l) => l.debit > 0).map((l) => ({ date: l.entry.date, remaining: l.debit }));
  let creditPool = lines.reduce((s, l) => s + l.credit, 0);

  for (const d of debits) {
    if (creditPool <= 0) break;
    const consume = Math.min(d.remaining, creditPool);
    d.remaining -= consume;
    creditPool -= consume;
  }

  const buckets = emptyBuckets();
  for (const d of debits) {
    if (d.remaining <= 0) continue;
    const age = differenceInCalendarDays(asOf, d.date);
    buckets[bucketFor(age)] += d.remaining;
    buckets.total += d.remaining;
  }
  return buckets;
}

export async function getAllCustomersAgeing(asOf: Date = new Date()) {
  const customers = await prisma.account.findMany({ where: { type: "CUSTOMER", isActive: true }, orderBy: { name: "asc" } });
  const results = await Promise.all(
    customers.map(async (c) => ({ customer: c, buckets: await getCustomerAgeing(c.id, asOf) })),
  );
  return results.filter((r) => r.buckets.total > 0);
}
