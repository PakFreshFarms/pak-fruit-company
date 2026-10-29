"use client";

import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/button";
import { formatPKR, amountInWords } from "@/lib/money";
import { Printer } from "lucide-react";

interface LotLine {
  name: string;
  crates: number;
  reportRate: number;
  amount: number;
}

interface ExpenseLine {
  head: string;
  label: string;
  amount: number;
}

interface Totals {
  grossReport: number;
  commission: number;
  totalExpenses: number;
  netPayable: number;
}

export function PattiView({
  isOwner,
  shopName,
  shopAddress,
  pattiNo,
  pattiDate,
  vendorName,
  vendorAddress,
  biltiNo,
  truckNo,
  itemName,
  commissionRate,
  lots,
  actualTotal,
  rateDifference,
  expenseLines,
  totals,
  previousBalance,
  advanceAdjusted,
  closingBalance,
  closedWithUnsold,
  closeReason,
}: {
  isOwner: boolean;
  shopName: string;
  shopAddress: string;
  pattiNo: string;
  pattiDate: string;
  vendorName: string;
  vendorAddress: string | null;
  biltiNo: string;
  truckNo: string;
  itemName: string;
  commissionRate: number;
  lots: LotLine[];
  actualTotal: number;
  rateDifference: number;
  expenseLines: ExpenseLine[];
  totals: Totals;
  previousBalance: number;
  advanceAdjusted: number;
  closingBalance: number;
  closedWithUnsold: boolean;
  closeReason: string | null;
}) {
  const t = useTranslation();
  const identityRhs = totals.netPayable + totals.commission + totals.totalExpenses + rateDifference;

  return (
    <div>
      <div className="no-print mb-4 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          {t("common.print_a4")}
        </Button>
      </div>

      <div className="print-area mx-auto max-w-2xl border border-border bg-card p-8 text-sm">
        <div className="mb-6 text-center">
          <div className="text-lg font-bold">{shopName}</div>
          {shopAddress && <div className="text-xs text-muted-foreground">{shopAddress}</div>}
          <div className="mt-2 text-base font-semibold">{t("patti.title")}</div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1">
          <div>
            {t("patti.pattiNo")}: <span className="font-medium">{pattiNo}</span>
          </div>
          <div>
            {t("patti.pattiDate")}: <span className="font-medium">{format(new Date(pattiDate), "dd MMM yyyy")}</span>
          </div>
          <div>
            {t("vocab.vendor")}: <span className="font-medium">{vendorName}</span>
          </div>
          <div>{vendorAddress}</div>
          <div>
            {t("vocab.bilti")}: <span className="font-medium">{biltiNo}</span>
          </div>
          <div>
            {t("vocab.truckNo")}: <span className="font-medium">{truckNo}</span>
          </div>
          <div>
            Item: <span className="font-medium">{itemName}</span>
          </div>
        </div>

        {closedWithUnsold && (
          <div className="mb-4 border border-dashed border-border p-2 text-xs text-muted-foreground">
            Closed with unsold crates. Reason: {closeReason}
          </div>
        )}

        <table className="ledger-table mb-4">
          <thead>
            <tr>
              <th>{t("bilti.lotName")}</th>
              <th className="num">{t("common.crates")}</th>
              <th className="num">{t("vocab.reportRate")}</th>
              <th className="num">{t("common.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td className="num">{l.crates}</td>
                <td className="num">
                  <Money paisa={l.reportRate} />
                </td>
                <td className="num">
                  <Money paisa={l.amount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto flex max-w-xs flex-col gap-1">
          <div className="flex justify-between border-t border-border pt-1 font-medium">
            <span>{t("patti.grossTotal")}</span>
            <Money paisa={totals.grossReport} />
          </div>
          <div className="flex justify-between text-danger">
            <span>
              {t("patti.lessCommission")} ({commissionRate}%)
            </span>
            <span>-{formatPKR(totals.commission)}</span>
          </div>
          {expenseLines.map((l) => (
            <div key={l.head} className="flex justify-between text-danger">
              <span>{l.label}</span>
              <span>-{formatPKR(l.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
            <span>{t("patti.netPayableInFigures")}</span>
            <Money paisa={totals.netPayable} />
          </div>
        </div>

        <div className="my-3 text-xs italic text-muted-foreground">
          {t("patti.netPayableInWords")}: {amountInWords(totals.netPayable)}
        </div>

        <div className="mt-6 flex flex-col gap-1 border-t border-border pt-3">
          <div className="flex justify-between">
            <span>{t("patti.previousBalance")}</span>
            <Money paisa={previousBalance} />
          </div>
          <div className="flex justify-between">
            <span>{t("patti.advanceAdjusted")}</span>
            <Money paisa={-advanceAdjusted} />
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t("patti.closingBalance")}</span>
            <Money paisa={closingBalance} />
          </div>
        </div>

        <div className="mt-10 flex justify-between text-xs text-muted-foreground">
          <div>{t("patti.vendorSignature")}: ______________</div>
          <div>{t("patti.arhtiSignature")}: ______________</div>
        </div>
      </div>

      {isOwner && (
        <div className="no-print mx-auto mt-6 max-w-2xl rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm">
          <h3 className="mb-3 text-sm font-semibold">{t("patti.reconciliationPanel")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              Actual sale total: <Money paisa={actualTotal} className="font-medium" />
            </div>
            <div>
              {t("vocab.rateDifference")}: <Money paisa={rateDifference} className="font-medium" />
            </div>
            <div>
              {t("vocab.netPayable")}: <Money paisa={totals.netPayable} className="font-medium" />
            </div>
            <div>
              {t("vocab.commission")}: <Money paisa={totals.commission} className="font-medium" />
            </div>
            <div>
              Expenses charged: <Money paisa={totals.totalExpenses} className="font-medium" />
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3 text-xs">
            <p className="mb-1 text-muted-foreground">{t("patti.reconciliationIdentity")}</p>
            <p className="tabular-nums">
              <Money paisa={actualTotal} /> = <Money paisa={totals.netPayable} /> + <Money paisa={totals.commission} /> + <Money paisa={totals.totalExpenses} /> + <Money paisa={rateDifference} />
            </p>
            <p className={`mt-1 font-medium ${actualTotal === identityRhs ? "text-success" : "text-danger"}`}>
              {actualTotal === identityRhs ? "✓ Reconciles exactly" : "✗ Does not reconcile — check entries"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
