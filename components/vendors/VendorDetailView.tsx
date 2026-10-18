"use client";

import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvanceDialog } from "./AdvanceDialog";

interface LedgerRow {
  date: string;
  narration: string;
  refType: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export function VendorDetailView({
  vendor,
  balance,
  ledger,
  rateDiff,
}: {
  vendor: { id: string; name: string; nameUr: string | null; code: string; phone: string | null; address: string | null };
  balance: number;
  ledger: LedgerRow[];
  rateDiff: { given: number; recovered: number; net: number };
}) {
  const t = useTranslation();

  return (
    <div>
      <PageHeader
        title={`${vendor.name}${vendor.nameUr ? " · " + vendor.nameUr : ""}`}
        subtitle={`${vendor.code}${vendor.phone ? " · " + vendor.phone : ""}`}
        actions={<AdvanceDialog vendorId={vendor.id} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">{t("common.balance")}</div>
            <div className="text-2xl font-semibold tabular-nums">
              <Money paisa={balance} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("vendor.rateDifferencePosition")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">{t("vendor.given")}</div>
              <Money paisa={-rateDiff.given} className="text-base font-medium" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("vendor.recovered")}</div>
              <Money paisa={rateDiff.recovered} className="text-base font-medium" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("vendor.net")}</div>
              <Money paisa={rateDiff.net} className="text-base font-medium" />
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="mb-2 text-sm font-semibold">{t("vendor.ledger")}</h3>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>{t("common.date")}</th>
            <th>{t("common.narration")}</th>
            <th className="num">{t("common.debit")}</th>
            <th className="num">{t("common.credit")}</th>
            <th className="num">{t("common.balance")}</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((row, i) => (
            <tr key={i}>
              <td>{format(new Date(row.date), "dd MMM yyyy")}</td>
              <td>{row.narration}</td>
              <td className="num">{row.debit > 0 ? <Money paisa={row.debit} /> : ""}</td>
              <td className="num">{row.credit > 0 ? <Money paisa={row.credit} /> : ""}</td>
              <td className="num font-medium">
                <Money paisa={row.runningBalance} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
