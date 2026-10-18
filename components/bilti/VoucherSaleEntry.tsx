"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountCombobox, type ComboboxAccount } from "@/components/shared/AccountCombobox";
import { Money } from "@/components/shared/Money";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createSaleAction } from "@/app/actions/sales";
import { toPaisa } from "@/lib/money";
import { computeSale } from "@/lib/accounting/calculations";
import { Plus } from "lucide-react";

interface LotOption {
  id: string;
  name: string;
  reportRate: number;
  crates: number;
  soldCrates: number;
}

const CUSTOMER_FIELD_ID = "voucher-sale-customer";

/**
 * One fast-entry row per voucher (not per lot): Lot, Customer, Crates, Rate,
 * all reachable by Tab with no mouse. Enter saves and the row resets for the
 * next sale — lot stays selected (it's the field a munshi fills repeatedly,
 * selling one lot to many buyers in a row) while customer/crates/rate clear
 * and focus returns to Customer, ready to type the next buyer immediately.
 */
export function VoucherSaleEntry({ biltiId, lots, customers }: { biltiId: string; lots: LotOption[]; customers: ComboboxAccount[] }) {
  const t = useTranslation();
  const openLots = lots.filter((l) => l.crates - l.soldCrates > 0);
  const [lotId, setLotId] = useState<string>(openLots[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [crates, setCrates] = useState("");
  const [actualRate, setActualRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cratesRef = useRef<HTMLInputElement>(null);

  // Keep the lot selection valid as the voucher's lots change underneath us
  // (e.g. this lot just sold out after the last save).
  useEffect(() => {
    if (!openLots.some((l) => l.id === lotId)) {
      setLotId(openLots[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots]);

  const selectedLot = openLots.find((l) => l.id === lotId);
  const remaining = selectedLot ? selectedLot.crates - selectedLot.soldCrates : 0;
  const cratesNum = Number(crates) || 0;
  const rateNum = actualRate ? toPaisa(Number(actualRate)) : 0;
  const preview = selectedLot && cratesNum > 0 && rateNum > 0 ? computeSale(selectedLot.reportRate, rateNum, cratesNum) : null;

  async function submit() {
    if (!selectedLot) return;
    if (!customerId || !crates || !actualRate) {
      toast.error(t("common.required"));
      return;
    }
    if (cratesNum > remaining) {
      toast.error(t("bilti.cratesLeft", { n: remaining }));
      return;
    }
    setSubmitting(true);
    const res = await createSaleAction({
      lotId: selectedLot.id,
      biltiId,
      date: new Date(),
      customerId,
      crates: cratesNum,
      actualRate: Number(actualRate),
    });
    setSubmitting(false);
    if (res.ok) {
      setCustomerId("");
      setCrates("");
      setActualRate("");
      document.getElementById(CUSTOMER_FIELD_ID)?.focus();
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  if (openLots.length === 0) {
    return <p className="mb-3 text-sm text-muted-foreground">{t("bilti.allLotsSold")}</p>;
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/20 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("bilti.quickSaleEntry")}</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("bilti.lots")}</Label>
          <Select value={lotId} onValueChange={setLotId}>
            <SelectTrigger>
              <SelectValue placeholder={t("bilti.selectLot")} />
            </SelectTrigger>
            <SelectContent>
              {openLots.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} — {t("bilti.cratesLeft", { n: l.crates - l.soldCrates })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("customer.title")}</Label>
          <AccountCombobox
            id={CUSTOMER_FIELD_ID}
            accounts={customers}
            value={customerId || undefined}
            onChange={setCustomerId}
            placeholder={t("customer.title")}
            allowCreate={{ type: "CUSTOMER" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("common.crates")}</Label>
          <Input
            ref={cratesRef}
            type="number"
            value={crates}
            max={remaining}
            onChange={(e) => setCrates(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("vocab.actualRate")}</Label>
          <Input type="number" step="0.01" value={actualRate} onChange={(e) => setActualRate(e.target.value)} onKeyDown={onKeyDown} className="w-28" />
        </div>
        <Button onClick={submit} disabled={submitting}>
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </div>
      {preview && (
        <div className="mt-2 flex gap-4 text-sm">
          <span>
            {t("common.amount")}: <Money paisa={preview.actualAmount} className="font-medium" />
          </span>
          {preview.rateDifference !== 0 && (
            <span className={preview.rateDifference < 0 ? "text-danger" : "text-success"}>
              {t("vocab.rateDifference")}: <Money paisa={preview.rateDifference} className="font-medium" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
