import { prisma } from "@/lib/db/prisma";
import { BiltiListView } from "@/components/bilti/BiltiListView";

export const dynamic = "force-dynamic";

export default async function BiltiListPage() {
  const biltis = await prisma.bilti.findMany({
    include: { vouchers: { include: { vendor: true, lots: { include: { sales: true } } } } },
    orderBy: { date: "desc" },
  });

  return (
    <BiltiListView
      biltis={biltis.map((b) => {
        const soldCrates = b.vouchers.reduce(
          (s, v) => s + v.lots.reduce((ss, l) => ss + l.sales.reduce((sss, sale) => sss + sale.crates, 0), 0),
          0,
        );
        return {
          id: b.id,
          biltiNo: b.biltiNo,
          truckNo: b.truckNo,
          date: b.date.toISOString(),
          itemName: b.itemName,
          totalCrates: b.totalCrates,
          soldCrates,
          status: b.status,
          vendorNames: [...new Set(b.vouchers.map((v) => v.vendor.name))],
        };
      })}
    />
  );
}
