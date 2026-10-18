"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { NewBiltiDialog } from "./NewBiltiDialog";
import { Truck } from "lucide-react";

interface BiltiRow {
  id: string;
  biltiNo: string;
  truckNo: string;
  date: string;
  itemName: string;
  totalCrates: number;
  soldCrates: number;
  status: "OPEN" | "COMPLETE";
  vendorNames: string[];
}

export function BiltiListView({ biltis }: { biltis: BiltiRow[] }) {
  const t = useTranslation();

  const columns: ColumnDef<BiltiRow, unknown>[] = [
    {
      accessorKey: "biltiNo",
      header: t("bilti.biltiNo"),
      cell: ({ row }) => (
        <Link href={`/bilti/${row.original.id}`} className="font-medium hover:underline">
          {row.original.biltiNo}
        </Link>
      ),
    },
    { accessorKey: "date", header: t("common.date"), cell: ({ getValue }) => format(new Date(getValue() as string), "dd MMM yyyy") },
    { accessorKey: "truckNo", header: t("bilti.truckNo") },
    { accessorKey: "itemName", header: t("bilti.itemName") },
    {
      accessorKey: "vendorNames",
      header: t("common.vendors"),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{(getValue() as string[]).join(", ") || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "crates",
      header: t("bilti.cratesSoldTotal"),
      accessorFn: (row) => row.soldCrates,
      cell: ({ row }) => (
        <div className="num">
          {row.original.soldCrates} / {row.original.totalCrates}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ getValue }) => {
        const status = getValue() as "OPEN" | "COMPLETE";
        return <Badge variant={status === "COMPLETE" ? "success" : "outline"}>{t(`bilti.status_${status}`)}</Badge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader title={t("bilti.list")} actions={<NewBiltiDialog />} />
      <DataTable
        columns={columns}
        data={biltis}
        searchId="bilti-search"
        emptyIcon={Truck}
        emptyInstruction="Create a bilti when a truck arrives at the shop to start recording vouchers."
      />
    </div>
  );
}
