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
import { addLotAction } from "@/app/actions/bilti";
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
const CRATES_FIELD_ID = "voucher-sale-crates";
const RATE_FIELD_ID = "voucher-sale-rate";
const NEW_LOT_NAME_ID = "voucher-sale-new-lot-name";
const NEW_LOT_CRATES_ID = "voucher-sale-new-lot-crates";
const NEW_LOT_RATE_ID = "voucher-sale-new-lot-rate";

/**
 * One fast-entry row per voucher (not per lot): Lot, Customer, Crates, Rate,
 * all reachable by Tab with no mouse. Enter saves and the row resets for the
 * next sale — lot stays selected (it's the field a munshi fills repeatedly,
 * selling one lot to many buyers in a row) while customer/crates/rate clear
 * and focus returns to Customer, ready to type the next buyer immediately.
 */
export function VoucherSaleEntry({
  biltiId,
  voucherId,
  lots,
  customers,
  onSaved,
}: {
  biltiId: string;
  voucherId: string;
  lots: LotOption[];
  customers: ComboboxAccount[];
  onSaved?: () => void;
}) {
  const t = useTranslation();
  const openLots = lots.filter((l) => l.crates - l.soldCrates > 0);
  const [lotId, setLotId] = useState<string>(openLots[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [crates, setCrates] = useState("");
  const [actualRate, setActualRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cratesRef = useRef<HTMLInputElement>(null);

  const [addingLot, setAddingLot] = useState(false);
  const [newLot, setNewLot] = useState({ name: "", crates: "", reportRate: "" });
  const [savingLot, setSavingLot] = useState(false);

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
      onSaved?.();
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  function onCratesKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById(RATE_FIELD_ID)?.focus();
    }
  }

  function onRateKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  async function submitNewLot() {
    if (!newLot.name || !newLot.crates || !newLot.reportRate) {
      toast.error(t("common.required"));
      return;
    }
    setSavingLot(true);
    const res = await addLotAction({
      voucherId,
      biltiId,
      name: newLot.name,
      crates: Number(newLot.crates),
      reportRate: Number(newLot.reportRate),
    });
    setSavingLot(false);
    if (res.ok && res.id) {
      setLotId(res.id);
      setNewLot({ name: "", crates: "", reportRate: "" });
      setAddingLot(false);
      document.getElementById(CUSTOMER_FIELD_ID)?.focus();
      onSaved?.();
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  function newLotKeyDown(nextId: string | (() => void)) {
    return (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (typeof nextId === "string") document.getElementById(nextId)?.focus();
      else nextId();
    };
  }

  if (openLots.length === 0 && !addingLot) {
    return (
      <div className="mb-4 flex flex-col gap-2">
        <p className="text-base text-muted-foreground">{t("bilti.allLotsSold")}</p>
        <Button variant="outline" size="sm" className="self-start" onClick={() => setAddingLot(true)}>
          <Plus className="size-4" />
          {t("bilti.addLot")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/20 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("bilti.quickSaleEntry")}</h4>
      {addingLot ? (
        <div className="mb-3 flex flex-col gap-3 rounded-md border border-border bg-card p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={NEW_LOT_NAME_ID}>{t("bilti.lotName")}</Label>
              <Input
                id={NEW_LOT_NAME_ID}
                autoFocus
                placeholder="Mosami Chaunsa"
                value={newLot.name}
                onChange={(e) => setNewLot((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={newLotKeyDown(NEW_LOT_CRATES_ID)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={NEW_LOT_CRATES_ID}>{t("common.crates")}</Label>
              <Input
                id={NEW_LOT_CRATES_ID}
                type="number"
                className="w-24"
                value={newLot.crates}
                onChange={(e) => setNewLot((f) => ({ ...f, crates: e.target.value }))}
                onKeyDown={newLotKeyDown(NEW_LOT_RATE_ID)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={NEW_LOT_RATE_ID}>{t("vocab.reportRate")}</Label>
              <Input
                id={NEW_LOT_RATE_ID}
                type="number"
                step="0.01"
                className="w-28"
                disabled={savingLot}
                value={newLot.reportRate}
                onChange={(e) => setNewLot((f) => ({ ...f, reportRate: e.target.value }))}
                onKeyDown={newLotKeyDown(submitNewLot)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingLot(false);
                setNewLot({ name: "", crates: "", reportRate: "" });
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" disabled={savingLot} onClick={submitNewLot}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setAddingLot(true)}>
            <Plus className="size-4" />
            {t("bilti.addLot")}
          </Button>
        </div>
      )}
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
          <Label className="text-xs">{t("vocab.customer")}</Label>
          <AccountCombobox
            id={CUSTOMER_FIELD_ID}
            accounts={customers}
            value={customerId || undefined}
            onChange={(id) => {
              setCustomerId(id);
              document.getElementById(CRATES_FIELD_ID)?.focus();
            }}
            placeholder={t("vocab.customer")}
            allowCreate={{ type: "CUSTOMER" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("common.crates")}</Label>
          <Input
            id={CRATES_FIELD_ID}
            ref={cratesRef}
            type="number"
            value={crates}
            max={remaining}
            onChange={(e) => setCrates(e.target.value)}
            onKeyDown={onCratesKeyDown}
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("vocab.actualRate")}</Label>
          <Input
            id={RATE_FIELD_ID}
            type="number"
            step="0.01"
            value={actualRate}
            onChange={(e) => setActualRate(e.target.value)}
            onKeyDown={onRateKeyDown}
            className="w-28"
          />
        </div>
        <Button onClick={submit} disabled={submitting || !selectedLot}>
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
