"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountCombobox, type ComboboxAccount } from "@/components/shared/AccountCombobox";
import { Money } from "@/components/shared/Money";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createSaleAction } from "@/app/actions/sales";
import { toPaisa } from "@/lib/money";
import { computeSale } from "@/lib/accounting/calculations";

export function SaleEntryRow({
  biltiId,
  lotId,
  reportRate,
  remaining,
  customers,
}: {
  biltiId: string;
  lotId: string;
  reportRate: number;
  remaining: number;
  customers: ComboboxAccount[];
}) {
  const t = useTranslation();
  const [customerId, setCustomerId] = useState("");
  const [crates, setCrates] = useState("");
  const [actualRate, setActualRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cratesRef = useRef<HTMLInputElement>(null);

  const cratesNum = Number(crates) || 0;
  const rateNum = actualRate ? toPaisa(Number(actualRate)) : 0;
  const preview = cratesNum > 0 && rateNum > 0 ? computeSale(reportRate, rateNum, cratesNum) : null;

  async function submit() {
    if (!customerId || !crates || !actualRate) {
      toast.error(t("common.required"));
      return;
    }
    if (cratesNum > remaining) {
      toast.error(`${t("bilti.remainingCrates")}: ${remaining}`);
      return;
    }
    setSubmitting(true);
    const res = await createSaleAction({
      lotId,
      biltiId,
      date: new Date(),
      customerId,
      crates: cratesNum,
      actualRate: Number(actualRate),
    });
    setSubmitting(false);
    if (res.ok) {
      setCrates("");
      setActualRate("");
      cratesRef.current?.focus();
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

  if (remaining <= 0) return null;

  return (
    <tr className="bg-muted/40">
      <td className="text-xs text-muted-foreground">{format(new Date(), "dd MMM")}</td>
      <td className="w-56">
        <AccountCombobox accounts={customers} value={customerId || undefined} onChange={setCustomerId} placeholder={t("customer.title")} />
      </td>
      <td className="w-24">
        <Input
          ref={cratesRef}
          type="number"
          value={crates}
          max={remaining}
          onChange={(e) => setCrates(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`${t("bilti.remainingCrates")}: ${remaining}`}
          className="h-8"
        />
      </td>
      <td className="w-28">
        <Input
          type="number"
          step="0.01"
          value={actualRate}
          onChange={(e) => setActualRate(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-8"
        />
      </td>
      <td className="num">{preview && <Money paisa={preview.actualAmount} />}</td>
      <td className="num">
        {preview && preview.rateDifference !== 0 && (
          <span className={preview.rateDifference < 0 ? "text-danger" : "text-success"}>
            <Money paisa={preview.rateDifference} />
          </span>
        )}
      </td>
      <td>
        <Button size="sm" onClick={submit} disabled={submitting}>
          {t("common.add")}
        </Button>
      </td>
    </tr>
  );
}
