"use client";

import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Card, CardContent } from "@/components/ui/card";
import { RecoveryDialog } from "./RecoveryDialog";
import type { AgeingBuckets } from "@/lib/reports/ageing";

interface LedgerRow {
  date: string;
  narration: string;
  refType: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export function CustomerDetailView({
  customer,
  balance,
  ledger,
  ageing,
}: {
  customer: { id: string; name: string; nameUr: string | null; code: string; phone: string | null };
  balance: number;
  ledger: LedgerRow[];
  ageing: AgeingBuckets;
}) {
  const t = useTranslation();

  const buckets: [string, number][] = [
    [t("customer.bucket0_7"), ageing.b0_7],
    [t("customer.bucket8_15"), ageing.b8_15],
    [t("customer.bucket16_30"), ageing.b16_30],
    [t("customer.bucket30plus"), ageing.b30plus],
  ];

  return (
    <div>
      <PageHeader
        title={`${customer.name}${customer.nameUr ? " · " + customer.nameUr : ""}`}
        subtitle={`${customer.code}${customer.phone ? " · " + customer.phone : ""}`}
        actions={<RecoveryDialog customerId={customer.id} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">{t("customer.outstanding")}</div>
            <div className="text-2xl font-semibold tabular-nums">
              <Money paisa={balance} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid grid-cols-4 gap-3 py-4">
            {buckets.map(([label, amount]) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <Money paisa={amount} className="text-sm font-medium" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <h3 className="mb-2 text-sm font-semibold">{t("customer.ledger")}</h3>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>{t("common.date")}</th>
            <th>{t("common.narration")}</th>
            <th className="num">Debit</th>
            <th className="num">Credit</th>
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
