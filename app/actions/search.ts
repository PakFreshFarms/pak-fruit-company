"use server";

import { prisma } from "@/lib/db/prisma";

export interface SearchResult {
  type: "vendor" | "customer" | "bilti" | "farm";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export async function searchEverything(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [vendors, customers, biltis, farms] = await Promise.all([
    prisma.account.findMany({
      where: { type: "VENDOR", isActive: true, OR: [{ name: { contains: q } }, { code: { contains: q } }] },
      take: 5,
    }),
    prisma.account.findMany({
      where: { type: "CUSTOMER", isActive: true, OR: [{ name: { contains: q } }, { code: { contains: q } }] },
      take: 5,
    }),
    prisma.bilti.findMany({
      where: { OR: [{ biltiNo: { contains: q } }, { truckNo: { contains: q } }] },
      take: 5,
    }),
    prisma.farm.findMany({
      where: { name: { contains: q } },
      take: 5,
    }),
  ]);

  return [
    ...vendors.map((v) => ({ type: "vendor" as const, id: v.id, title: v.name, subtitle: v.code, href: `/vendors/${v.id}` })),
    ...customers.map((c) => ({ type: "customer" as const, id: c.id, title: c.name, subtitle: c.code, href: `/customers/${c.id}` })),
    ...biltis.map((b) => ({ type: "bilti" as const, id: b.id, title: `Bilti ${b.biltiNo}`, subtitle: `Truck ${b.truckNo}`, href: `/bilti/${b.id}` })),
    ...farms.map((f) => ({ type: "farm" as const, id: f.id, title: f.name, subtitle: f.season, href: `/farms/${f.id}` })),
  ];
}
