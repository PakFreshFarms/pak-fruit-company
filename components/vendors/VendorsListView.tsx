"use client";

import Link from "next/link";
import { formatWhen } from "@/lib/i18n/formatWhen";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { DataTable } from "@/components/shared/DataTable";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { Users } from "lucide-react";

interface VendorRow {
  id: string;
  code: string;
  name: string;
  nameUr: string | null;
  phone: string | null;
  balance: number;
  lastActivity: string | null;
}

export function VendorsListView({ vendors }: { vendors: VendorRow[] }) {
  const { t, locale } = useLocale();

  const columns: ColumnDef<VendorRow, unknown>[] = [
    { accessorKey: "code", header: t("common.code") },
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <>
          <Link href={`/vendors/${row.original.id}`} className="hover:underline">
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
      header: t("common.balance"),
      cell: ({ getValue }) => (
        <div className="num">
          <Money paisa={getValue() as number} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t("vendor.title")} actions={<AccountFormDialog fixedType="VENDOR" triggerLabel={t("vendor.addVendor")} />} />
      <DataTable
        columns={columns}
        data={vendors}
        searchId="vendor-search"
        emptyIcon={Users}
        emptyInstruction="Add a vendor to start recording biltis for their consignments."
      />
    </div>
  );
}
