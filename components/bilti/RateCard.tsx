"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Vocab } from "@/components/shared/Vocab";
import { updateBiltiExpenseAction } from "@/app/actions/bilti";
import { toPaisa, formatPKR } from "@/lib/money";
import { Calculator } from "lucide-react";
import type { ExpenseBasis } from "@prisma/client";

interface ExpenseRow {
  id: string;
  head: string;
  label: string;
  basis: ExpenseBasis;
  rate: number;
}

const VOCAB_MAP: Record<string, "kiraya" | "mazdoori" | "munshiyana" | "daak" | "bardana" | "peshgi" | undefined> = {
  KIRAYA: "kiraya",
  MAZDOORI: "mazdoori",
  MUNSHIYANA: "munshiyana",
  DAAK: "daak",
  BARDANA: "bardana",
  PESHGI: "peshgi",
};

function KirayaHelper({ onFill }: { onFill: (perCrate: number) => void }) {
  const t = useTranslation();
  const [total, setTotal] = useState("");
  const [crates, setCrates] = useState("");
  const perCrate = Number(total) > 0 && Number(crates) > 0 ? Number(total) / Number(crates) : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title={t("bilti.kirayaHelper")}>
          <Calculator className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("bilti.kirayaHelper")}</p>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{t("bilti.totalFreight")}</Label>
            <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">{t("bilti.totalCrates")}</Label>
            <Input type="number" value={crates} onChange={(e) => setCrates(e.target.value)} />
          </div>
          {perCrate > 0 && <p className="text-xs">= {perCrate.toFixed(2)} / crate</p>}
          <Button size="sm" disabled={perCrate <= 0} onClick={() => onFill(perCrate)}>
            {t("bilti.fillRate")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ExpenseRowEditor({ expense, biltiId, locked }: { expense: ExpenseRow; biltiId: string; locked: boolean }) {
  const t = useTranslation();
  const [rate, setRate] = useState((expense.rate / 100).toString());
  const [basis, setBasis] = useState<ExpenseBasis>(expense.basis);
  const [saving, setSaving] = useState(false);

  async function save(nextRate: string, nextBasis: ExpenseBasis) {
    setSaving(true);
    const res = await updateBiltiExpenseAction(biltiId, { id: expense.id, basis: nextBasis, rate: Number(nextRate) || 0, label: expense.label });
    setSaving(false);
    if (!res.ok) toast.error(res.error ?? t("common.error"));
  }

  return (
    <tr>
      <td>
        {VOCAB_MAP[expense.head] ? <Vocab term={VOCAB_MAP[expense.head]!} /> : expense.label}
      </td>
      <td>
        <Select
          value={basis}
          onValueChange={(v) => {
            setBasis(v as ExpenseBasis);
            save(rate, v as ExpenseBasis);
          }}
          disabled={locked}
        >
          <SelectTrigger className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PER_CRATE">{t("bilti.basisPerCrate")}</SelectItem>
            <SelectItem value="TRUCK_TOTAL_SPLIT">{t("bilti.basisTruckSplit")}</SelectItem>
            <SelectItem value="FIXED_PER_VOUCHER">{t("bilti.basisFixedPerVoucher")}</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="num">
        <div className="flex items-center justify-end gap-1">
          <Input
            className="h-8 w-28 text-right"
            type="number"
            step="0.01"
            value={rate}
            disabled={locked || saving}
            onChange={(e) => setRate(e.target.value)}
            onBlur={() => save(rate, basis)}
          />
          {expense.head === "KIRAYA" && !locked && <KirayaHelper onFill={(v) => { setRate(v.toFixed(2)); save(v.toFixed(2), basis); }} />}
        </div>
      </td>
      <td className="num text-xs text-muted-foreground">
        {basis === "TRUCK_TOTAL_SPLIT" ? `${formatPKR(toPaisa(Number(rate) || 0))} total` : `${formatPKR(toPaisa(Number(rate) || 0))} / crate`}
      </td>
    </tr>
  );
}

export function RateCard({ biltiId, expenses, locked }: { biltiId: string; expenses: ExpenseRow[]; locked: boolean }) {
  const t = useTranslation();
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold">{t("bilti.rateCard")}</h3>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>{t("bilti.expenseHead")}</th>
            <th>{t("bilti.basis")}</th>
            <th className="num">{t("common.rate")}</th>
            <th className="num"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <ExpenseRowEditor key={e.id} expense={e} biltiId={biltiId} locked={locked} />
          ))}
        </tbody>
      </table>
      {locked && <p className="mt-1 text-xs text-muted-foreground">{t("bilti.rateCardLocked")}</p>}
    </div>
  );
}
