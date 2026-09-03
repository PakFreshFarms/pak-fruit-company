"use client";

import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { RateCard } from "./RateCard";
import { AddVoucherDialog } from "./AddVoucherDialog";
import { VoucherBlock } from "./VoucherBlock";
import type { ComboboxAccount } from "@/components/shared/AccountCombobox";
import type { ExpenseBasis } from "@prisma/client";

interface BiltiHeader {
  id: string;
  biltiNo: string;
  truckNo: string;
  date: string;
  itemName: string;
  totalCrates: number;
  status: "OPEN" | "COMPLETE";
  expenses: { id: string; head: string; label: string; basis: ExpenseBasis; rate: number }[];
}

export function BiltiDetailView({
  bilti,
  assignedCrates,
  unassignedCrates,
  vouchers,
  vendors,
  customers,
}: {
  bilti: BiltiHeader;
  assignedCrates: number;
  unassignedCrates: number;
  vouchers: React.ComponentProps<typeof VoucherBlock>["voucher"][];
  vendors: ComboboxAccount[];
  customers: ComboboxAccount[];
}) {
  const t = useTranslation();
  const anyPattiIssued = vouchers.some((v) => v.status === "COMPLETE");

  return (
    <div>
      <PageHeader
        title={`${t("bilti.title")} ${bilti.biltiNo}`}
        subtitle={`${bilti.truckNo} · ${format(new Date(bilti.date), "dd MMM yyyy")} · ${bilti.itemName}`}
        actions={
          <>
            <Badge variant={bilti.status === "COMPLETE" ? "success" : "outline"}>{t(`bilti.status_${bilti.status}`)}</Badge>
            <AddVoucherDialog biltiId={bilti.id} vendors={vendors} unassignedCrates={unassignedCrates} />
          </>
        }
      />

      <div className="mb-4 flex gap-6 text-sm">
        <div>
          {t("bilti.totalCrates")}: <span className="font-medium">{bilti.totalCrates}</span>
        </div>
        <div>
          {t("bilti.assignedCrates")}: <span className="font-medium">{assignedCrates}</span>
        </div>
        <div>
          {t("bilti.unassignedCrates")}: <span className="font-medium">{unassignedCrates}</span>
        </div>
      </div>

      <RateCard biltiId={bilti.id} expenses={bilti.expenses} locked={anyPattiIssued} />

      <h3 className="mb-2 text-sm font-semibold">{t("bilti.vouchers")}</h3>
      {vouchers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vouchers yet — add one for each vendor whose fruit is on this truck.</p>
      ) : (
        vouchers.map((v) => <VoucherBlock key={v.id} biltiId={bilti.id} voucher={v} customers={customers} />)
      )}
    </div>
  );
}
