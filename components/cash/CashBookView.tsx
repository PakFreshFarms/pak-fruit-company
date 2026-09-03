"use client";

import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CashEntryDialog } from "./CashEntryDialog";
import { Wallet } from "lucide-react";
import type { ComboboxAccount } from "@/components/shared/AccountCombobox";

interface DayLine {
  id: string;
  date: string;
  narration: string;
  refType: string;
  debit: number;
  credit: number;
  contraName: string | null;
  mode: string | null;
}

const REF_LABELS: Record<string, string> = {
  CASH: "Cash",
  WASOOLI: "Wasooli",
  FARM_EXPENSE: "Farm",
  FARM_SALE: "Farm",
  OPENING: "Opening",
};

export function CashBookView({
  date,
  opening,
  closing,
  lines,
  accounts,
}: {
  date: string;
  opening: number;
  closing: number;
  lines: DayLine[];
  accounts: ComboboxAccount[];
}) {
  const t = useTranslation();
  const router = useRouter();
  const d = new Date(date);

  function goTo(newDate: Date) {
    router.push(`/cash-book?date=${format(newDate, "yyyy-MM-dd")}`);
  }

  return (
    <div>
      <PageHeader
        title={t("cash.title")}
        subtitle={format(d, "EEEE, dd MMMM yyyy")}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => goTo(subDays(d, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => goTo(new Date())}>
              {t("common.today")}
            </Button>
            <Button variant="outline" size="icon" onClick={() => goTo(addDays(d, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="no-print">
              <Printer className="size-4" />
            </Button>
            <CashEntryDialog accounts={accounts} defaultDate={date} />
          </>
        }
      />

      <div className="print-area">
        <div className="mb-4 flex justify-between rounded-md border border-border bg-card px-4 py-3 text-sm">
          <div>
            {t("cash.opening")}: <span className="font-semibold tabular-nums"><Money paisa={opening} /></span>
          </div>
          <div>
            {t("cash.closing")}: <span className="font-semibold tabular-nums"><Money paisa={closing} /></span>
          </div>
        </div>

        {lines.length === 0 ? (
          <EmptyState icon={Wallet} title={t("common.noResults")} instruction="No cash movement recorded for this day yet. Add an entry to get started." />
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>{t("common.narration")}</th>
                <th>Source</th>
                <th>{t("common.mode")}</th>
                <th className="num">{t("cash.in")}</th>
                <th className="num">{t("cash.out")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.narration}
                    {l.contraName && <span className="text-muted-foreground"> — {l.contraName}</span>}
                  </td>
                  <td className="text-xs text-muted-foreground">{REF_LABELS[l.refType] ?? l.refType}</td>
                  <td className="text-xs text-muted-foreground">{l.mode ?? "—"}</td>
                  <td className="num">{l.debit > 0 ? <Money paisa={l.debit} /> : ""}</td>
                  <td className="num">{l.credit > 0 ? <Money paisa={l.credit} /> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
