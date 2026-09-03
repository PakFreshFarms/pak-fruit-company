import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAccountLedger, getVendorRateDifferencePosition } from "@/lib/reports/ledger";
import { VendorDetailView } from "@/components/vendors/VendorDetailView";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.account.findUnique({ where: { id } });
  if (!vendor || vendor.type !== "VENDOR") notFound();

  const [ledger, rateDiff] = await Promise.all([getAccountLedger(id), getVendorRateDifferencePosition(id)]);
  const balance = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : 0;

  return (
    <VendorDetailView
      vendor={{ id: vendor.id, name: vendor.name, nameUr: vendor.nameUr, code: vendor.code, phone: vendor.phone, address: vendor.address }}
      balance={balance}
      ledger={ledger.map((l) => ({ ...l, date: l.date.toISOString() }))}
      rateDiff={rateDiff}
    />
  );
}
