import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAccountLedger } from "@/lib/reports/ledger";
import { getCustomerAgeing } from "@/lib/reports/ageing";
import { CustomerDetailView } from "@/components/customers/CustomerDetailView";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.account.findUnique({ where: { id } });
  if (!customer || customer.type !== "CUSTOMER") notFound();

  const [ledger, ageing] = await Promise.all([getAccountLedger(id), getCustomerAgeing(id)]);
  const balance = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : 0;

  return (
    <CustomerDetailView
      customer={{ id: customer.id, name: customer.name, nameUr: customer.nameUr, code: customer.code, phone: customer.phone }}
      balance={balance}
      ledger={ledger.map((l) => ({ ...l, date: l.date.toISOString() }))}
      ageing={ageing}
    />
  );
}
