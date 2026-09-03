"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/shared/Money";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { Wallet, ShoppingCart, Coins, Scale, Truck, TrendingUp, ScrollText, Clock } from "lucide-react";

interface Props {
  payable: number;
  receivable: number;
  cash: number;
  commission: number;
  rateDiff: number;
  openBiltisCount: number;
  awaitingPatti: { id: string; biltiId: string; biltiNo: string; voucherNo: string; vendorName: string; remaining: number; totalCrates: number }[];
  oldestCustomers: { id: string; name: string; balance: number; oldestDate: string }[];
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: React.ReactNode; tone?: "danger" | "success" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-lg font-semibold tabular-nums ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : ""}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardView(props: Props) {
  const t = useTranslation();
  const gap = props.payable - props.receivable;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t("dashboard.payableToVendors")} value={<Money paisa={props.payable} />} />
        <StatCard icon={ShoppingCart} label={t("dashboard.receivableFromCustomers")} value={<Money paisa={props.receivable} />} />
        <StatCard icon={Coins} label={t("dashboard.cashInHand")} value={<Money paisa={props.cash} />} />
        <StatCard icon={Scale} label={t("dashboard.payoutGap")} value={<Money paisa={gap} />} tone={gap > 0 ? "danger" : "success"} />
        <StatCard icon={Truck} label={t("dashboard.openBiltis")} value={props.openBiltisCount} />
        <StatCard icon={TrendingUp} label={t("dashboard.commissionThisMonth")} value={<Money paisa={props.commission} />} tone="success" />
        <StatCard icon={ScrollText} label={t("dashboard.netRateDifference")} value={<Money paisa={props.rateDiff} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.vouchersAwaitingPatti")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {props.awaitingPatti.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Truck}
                  title={t("common.noResults")}
                  instruction="Every voucher with fully sold crates has already been converted to a patti."
                />
              </div>
            ) : (
              <table className="ledger-table">
                <tbody>
                  {props.awaitingPatti.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/bilti/${v.biltiId}`} className="hover:underline">
                          {v.biltiNo} / {v.voucherNo}
                        </Link>
                      </td>
                      <td>{v.vendorName}</td>
                      <td className="num">
                        {v.remaining}/{v.totalCrates} {t("vocab.crate")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.oldestCustomerBalances")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {props.oldestCustomers.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Clock} title={t("common.noResults")} instruction="No customer has an outstanding balance right now." />
              </div>
            ) : (
              <table className="ledger-table">
                <tbody>
                  {props.oldestCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/customers/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.oldestDate), { addSuffix: true })}</td>
                      <td className="num">
                        <Money paisa={c.balance} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
