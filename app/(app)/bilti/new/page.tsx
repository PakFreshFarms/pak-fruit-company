import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/lib/settings";
import { SalesBookView } from "@/components/bilti/SalesBookView";

export const dynamic = "force-dynamic";

export default async function NewBiltiPage() {
  const [vendors, customers, shopName, shopAddress] = await Promise.all([
    prisma.account.findMany({ where: { type: "VENDOR", isActive: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { type: "CUSTOMER", isActive: true }, orderBy: { name: "asc" } }),
    getSetting("shopName", "Pak Fruit Company"),
    getSetting("shopAddress", ""),
  ]);

  return (
    <SalesBookView
      bilti={null}
      vouchers={[]}
      assignedCrates={0}
      vendors={vendors.map((v) => ({ id: v.id, name: v.name, code: v.code, nameUr: v.nameUr }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, code: c.code, nameUr: c.nameUr }))}
      shopName={shopName}
      shopAddress={shopAddress}
    />
  );
}
