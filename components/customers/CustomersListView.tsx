"use client";

import Link from "next/link";
import { formatWhen } from "@/lib/i18n/formatWhen";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { DataTable } from "@/components/shared/DataTable";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { ShoppingCart } from "lucide-react";

interface CustomerRow {
  id: string;
  code: string;
  name: string;
  nameUr: string | null;
  phone: string | null;
  balance: number;
  lastActivity: string | null;
}

export function CustomersListView({ customers }: { customers: CustomerRow[] }) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<CustomerRow, unknown>[] = [
    { accessorKey: "code", header: t("common.code") },
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <>
          <Link href={`/customers/${row.original.id}`} className="hover:underline">
            {row.original.name}
          </Link>
          {row.original.nameUr && <span className="ml-2 font-urdu text-muted-foreground">{row.original.nameUr}</span>}
        </>
      ),
    },
    { accessorKey: "phone", header: t("common.phone"), cell: ({ getValue }) => (getValue() as string) ?? "—" },
    {
      accessorKey: "lastActivity",
      header: t("vendor.lastActivity"),
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return <span className="text-xs text-muted-foreground">{v ? formatWhen(v, locale) : "—"}</span>;
      },
    },
    {
      accessorKey: "balance",
      header: t("customer.outstanding"),
      cell: ({ getValue }) => (
        <div className="num">
          <Money paisa={getValue() as number} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("customer.title")} actions={<AccountFormDialog fixedType="CUSTOMER" triggerLabel={t("customer.addCustomer")} />} />
      <DataTable
        columns={columns}
        data={customers}
        searchId="customer-search"
        emptyIcon={ShoppingCart}
        emptyInstruction="Add a customer before recording a sale to them."
      />
    </div>
  );
}
