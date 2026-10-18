"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddLotDialog } from "./AddLotDialog";
import { LotBlock } from "./LotBlock";
import { VoucherSaleEntry } from "./VoucherSaleEntry";
import { PattiButton } from "./PattiButton";
import { updateVoucherKirayaOverrideAction } from "@/app/actions/bilti";
import type { ComboboxAccount } from "@/components/shared/AccountCombobox";

interface ExpenseBreakdownLine {
  head: string;
  label: string;
  amount: number;
}

interface VoucherData {
  id: string;
  voucherNo: string;
  vendorId: string;
  vendorName: string;
  crates: number;
  kirayaOverride: number | null;
  status: "OPEN" | "COMPLETE";
  pattiNo: string | null;
  expenseBreakdown: { lines: ExpenseBreakdownLine[]; total: number };
  lotCrates: number;
  soldCrates: number;
  unassignedLotCrates: number;
  grossReport: number;
  canGeneratePatti: boolean;
  fullySold: boolean;
  lots: {
    id: string;
    name: string;
    crates: number;
    reportRate: number;
    soldCrates: number;
    sales: { id: string; date: string; customerId: string; customerName: string; crates: number; actualRate: number }[];
  }[];
}

export function VoucherBlock({ biltiId, voucher, customers }: { biltiId: string; voucher: VoucherData; customers: ComboboxAccount[] }) {
  const t = useTranslation();
  const [open, setOpen] = useState(true);
  const [kiraya, setKiraya] = useState(voucher.kirayaOverride != null ? (voucher.kirayaOverride / 100).toString() : "");

  async function saveKiraya() {
    const res = await updateVoucherKirayaOverrideAction({
      voucherId: voucher.id,
      biltiId,
      kirayaOverride: kiraya ? Number(kiraya) : null,
    });
    if (!res.ok) toast.error(res.error ?? t("common.error"));
  }

  const remaining = voucher.lotCrates - voucher.soldCrates;

  return (
    <div className="mb-4 rounded-lg border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <div>
            <div className="text-sm font-semibold">
              {t("bilti.voucherNo")} {voucher.voucherNo} — {voucher.vendorName}
            </div>
            <div className="text-xs text-muted-foreground">
              {voucher.crates} {t("common.crates")} · {voucher.soldCrates}/{voucher.lotCrates} {t("bilti.soldCrates").toLowerCase()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {voucher.pattiNo ? (
            <Link href={`/bilti/${biltiId}/voucher/${voucher.id}/patti`} onClick={(e) => e.stopPropagation()}>
              <Badge variant="success">{voucher.pattiNo}</Badge>
            </Link>
          ) : (
            <Badge variant="outline">{t(`bilti.status_${voucher.status}`)}</Badge>
          )}
          <Money paisa={voucher.grossReport} className="text-sm font-medium" />
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <Label className="text-xs text-muted-foreground">{t("bilti.kirayaOverride")}</Label>
              <Input
                type="number"
                step="0.01"
                value={kiraya}
                placeholder={t("bilti.useBiltiRate")}
                disabled={voucher.status === "COMPLETE"}
                onChange={(e) => setKiraya(e.target.value)}
                onBlur={saveKiraya}
                className="h-8"
              />
            </div>
            {voucher.expenseBreakdown.lines.map((l) => (
              <div key={l.head}>
                <Label className="text-xs text-muted-foreground">{l.label}</Label>
                <div className="text-sm tabular-nums">
                  <Money paisa={l.amount} />
                </div>
              </div>
            ))}
            <div>
              <Label className="text-xs text-muted-foreground">{t("common.total")}</Label>
              <div className="text-sm font-semibold tabular-nums">
                <Money paisa={voucher.expenseBreakdown.total} />
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t("bilti.lots")}</h4>
            {voucher.status === "OPEN" && <AddLotDialog biltiId={biltiId} voucherId={voucher.id} unassignedCrates={voucher.unassignedLotCrates} />}
          </div>

          {voucher.status === "OPEN" && voucher.lots.length > 0 && (
            <VoucherSaleEntry biltiId={biltiId} lots={voucher.lots} customers={customers} />
          )}

          {voucher.lots.map((lot) => (
            <LotBlock key={lot.id} biltiId={biltiId} lot={lot} voucherComplete={voucher.status === "COMPLETE"} />
          ))}

          {voucher.status === "OPEN" && voucher.lots.length > 0 && (
            <div className="mt-3 flex justify-end">
              <PattiButton voucherId={voucher.id} biltiId={biltiId} fullySold={remaining === 0} remaining={remaining} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
