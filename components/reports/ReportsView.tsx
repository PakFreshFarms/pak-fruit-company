"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";
import { Download, FileText } from "lucide-react";

interface Props {
  trialBalance: { rows: { name: string; code: string; type: string; debit: number; credit: number }[]; totalDebit: number; totalCredit: number };
  vendorBalances: { name: string; code: string; balance: number }[];
  customerBalances: { name: string; code: string; balance: number }[];
  ageing: { name: string; b0_7: number; b8_15: number; b16_30: number; b30plus: number; total: number }[];
  commissionByVendor: { vendorName: string; commission: number }[];
  rateDiff: { name: string; given: number; recovered: number; net: number }[];
  expenseVsPaid: { recovered: number; totalPaid: number; gainOrLoss: number; rows: { head: string; paid: number }[] };
  biltiProfitability: { biltiNo: string; truckNo: string; date: string; itemName: string; totalCrates: number; soldCrates: number; commission: number; expenseRecovery: number; status: string }[];
  farms: { name: string; season: string; rentAmount: number; totalExpenses: number; totalDispatchIncome: number; netResult: number }[];
  seasonClosing: {
    commission: number;
    netRateDifference: number;
    expenseGainOrLoss: number;
    farmNetTotal: number;
    totalVendorPayable: number;
    totalCustomerReceivable: number;
  };
  cancelledSales: {
    id: string;
    date: string;
    lotName: string;
    biltiNo: string;
    vendorName: string;
    customerName: string;
    crates: number;
    actualRate: number;
    cancelledAt: string;
    cancelledBy: string | null;
  }[];
  salesReport: {
    id: string;
    date: string;
    biltiNo: string;
    voucherNo: string;
    voucherStatus: "OPEN" | "COMPLETE";
    vendorName: string;
    lotName: string;
    customerName: string;
    crates: number;
    reportRate: number;
    actualRate: number;
    amount: number;
  }[];
}

const REPORTS = [
  "salesReport",
  "trialBalance",
  "vendorBalances",
  "customerBalances",
  "customerAgeing",
  "commissionEarned",
  "rateDifferenceReport",
  "expenseRecoveryVsPaid",
  "biltiProfitability",
  "farmProfitLoss",
  "seasonClosing",
  "cancelledSales",
] as const;

type ReportKey = (typeof REPORTS)[number];

function ExportBar({ title, columns, rows }: { title: string; columns: ExportColumn[]; rows: Record<string, unknown>[] }) {
  const t = useTranslation();
  return (
    <div className="mb-3 flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => exportToExcel(title, columns, rows, `${title}.xlsx`)}>
        <Download className="size-4" />
        {t("common.exportExcel")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToPdf(title, columns, rows, `${title}.pdf`)}>
        <FileText className="size-4" />
        {t("common.exportPdf")}
      </Button>
    </div>
  );
}

export function ReportsView(props: Props) {
  const t = useTranslation();
  const [active, setActive] = useState<ReportKey>("salesReport");

  return (
    <div>
      <PageHeader title={t("reports.title")} />
      <div className="flex gap-6">
        <nav className="w-52 shrink-0">
          {REPORTS.map((r) => (
            <button
              key={r}
              onClick={() => setActive(r)}
              className={cn("block w-full rounded-md px-3 py-2 text-left text-sm", active === r ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {t(`reports.${r}`)}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {active === "salesReport" && (
            <div>
              <ExportBar
                title={t("reports.salesReport")}
                columns={[
                  { header: t("common.date"), key: "date" },
                  { header: "Bilti", key: "biltiNo" },
                  { header: t("bilti.voucherNo"), key: "voucherNo" },
                  { header: t("reports.vendor"), key: "vendorName" },
                  { header: t("reports.lot"), key: "lotName" },
                  { header: t("customer.title"), key: "customerName" },
                  { header: t("common.crates"), key: "crates" },
                  { header: t("vocab.actualRate"), key: "actualRate", isMoney: true },
                  { header: t("common.amount"), key: "amount", isMoney: true },
                ]}
                rows={props.salesReport}
              />
              {props.salesReport.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
              ) : (
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>{t("common.date")}</th>
                      <th>Bilti</th>
                      <th>{t("bilti.voucherNo")}</th>
                      <th>{t("reports.vendor")}</th>
                      <th>{t("reports.lot")}</th>
                      <th>{t("customer.title")}</th>
                      <th className="num">{t("common.crates")}</th>
                      <th className="num">{t("vocab.actualRate")}</th>
                      <th className="num">{t("common.amount")}</th>
                      <th>{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.salesReport.map((s) => (
                      <tr key={s.id}>
                        <td className="text-xs text-muted-foreground">{format(new Date(s.date), "dd MMM yyyy, HH:mm")}</td>
                        <td>{s.biltiNo}</td>
                        <td>{s.voucherNo}</td>
                        <td>{s.vendorName}</td>
                        <td>{s.lotName}</td>
                        <td>{s.customerName}</td>
                        <td className="num">{s.crates}</td>
                        <td className="num">
                          <Money paisa={s.actualRate} />
                        </td>
                        <td className="num font-medium">
                          <Money paisa={s.amount} />
                        </td>
                        <td className="text-xs text-muted-foreground">{t(`bilti.status_${s.voucherStatus}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {active === "trialBalance" && (
            <div>
              <ExportBar
                title={t("reports.trialBalance")}
                columns={[
                  { header: t("common.code"), key: "code" },
                  { header: t("common.name"), key: "name" },
                  { header: t("common.type"), key: "type" },
                  { header: t("common.debit"), key: "debit", isMoney: true },
                  { header: t("common.credit"), key: "credit", isMoney: true },
                ]}
                rows={props.trialBalance.rows}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("common.code")}</th>
                    <th>{t("common.name")}</th>
                    <th>{t("common.type")}</th>
                    <th className="num">{t("common.debit")}</th>
                    <th className="num">{t("common.credit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.trialBalance.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td className="text-xs text-muted-foreground">{t(`account.type${r.type.charAt(0)}${r.type.slice(1).toLowerCase()}`)}</td>
                      <td className="num">{r.debit > 0 ? <Money paisa={r.debit} /> : ""}</td>
                      <td className="num">{r.credit > 0 ? <Money paisa={r.credit} /> : ""}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td colSpan={3}>{t("common.total")}</td>
                    <td className="num">
                      <Money paisa={props.trialBalance.totalDebit} />
                    </td>
                    <td className="num">
                      <Money paisa={props.trialBalance.totalCredit} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {active === "vendorBalances" && (
            <div>
              <ExportBar
                title={t("reports.vendorBalances")}
                columns={[
                  { header: t("common.code"), key: "code" },
                  { header: t("common.name"), key: "name" },
                  { header: t("common.balance"), key: "balance", isMoney: true },
                ]}
                rows={props.vendorBalances}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("common.code")}</th>
                    <th>{t("common.name")}</th>
                    <th className="num">{t("common.balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.vendorBalances.map((r, i) => (
                    <tr key={i}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td className="num">
                        <Money paisa={r.balance} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "customerBalances" && (
            <div>
              <ExportBar
                title={t("reports.customerBalances")}
                columns={[
                  { header: t("common.code"), key: "code" },
                  { header: t("common.name"), key: "name" },
                  { header: t("common.balance"), key: "balance", isMoney: true },
                ]}
                rows={props.customerBalances}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("common.code")}</th>
                    <th>{t("common.name")}</th>
                    <th className="num">{t("common.balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.customerBalances.map((r, i) => (
                    <tr key={i}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td className="num">
                        <Money paisa={r.balance} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "customerAgeing" && (
            <div>
              <ExportBar
                title={t("reports.customerAgeing")}
                columns={[
                  { header: t("common.name"), key: "name" },
                  { header: t("customer.bucket0_7"), key: "b0_7", isMoney: true },
                  { header: t("customer.bucket8_15"), key: "b8_15", isMoney: true },
                  { header: t("customer.bucket16_30"), key: "b16_30", isMoney: true },
                  { header: t("customer.bucket30plus"), key: "b30plus", isMoney: true },
                  { header: t("common.total"), key: "total", isMoney: true },
                ]}
                rows={props.ageing}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("common.name")}</th>
                    <th className="num">{t("customer.bucket0_7")}</th>
                    <th className="num">{t("customer.bucket8_15")}</th>
                    <th className="num">{t("customer.bucket16_30")}</th>
                    <th className="num">{t("customer.bucket30plus")}</th>
                    <th className="num">{t("common.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.ageing.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td className="num">
                        <Money paisa={r.b0_7} />
                      </td>
                      <td className="num">
                        <Money paisa={r.b8_15} />
                      </td>
                      <td className="num">
                        <Money paisa={r.b16_30} />
                      </td>
                      <td className="num">
                        <Money paisa={r.b30plus} />
                      </td>
                      <td className="num font-medium">
                        <Money paisa={r.total} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "commissionEarned" && (
            <div>
              <ExportBar
                title={t("reports.commissionEarned")}
                columns={[
                  { header: t("vocab.vendor"), key: "vendorName" },
                  { header: t("vocab.commission"), key: "commission", isMoney: true },
                ]}
                rows={props.commissionByVendor}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("vocab.vendor")}</th>
                    <th className="num">{t("vocab.commission")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.commissionByVendor.map((r, i) => (
                    <tr key={i}>
                      <td>{r.vendorName}</td>
                      <td className="num">
                        <Money paisa={r.commission} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">{t("reports.lastMonthNote")}</p>
            </div>
          )}

          {active === "rateDifferenceReport" && (
            <div>
              <ExportBar
                title={t("reports.rateDifferenceReport")}
                columns={[
                  { header: t("vocab.vendor"), key: "name" },
                  { header: t("vendor.given"), key: "given", isMoney: true },
                  { header: t("vendor.recovered"), key: "recovered", isMoney: true },
                  { header: t("vendor.net"), key: "net", isMoney: true },
                ]}
                rows={props.rateDiff}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("vocab.vendor")}</th>
                    <th className="num">{t("vendor.given")}</th>
                    <th className="num">{t("vendor.recovered")}</th>
                    <th className="num">{t("vendor.net")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.rateDiff.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td className="num">
                        <Money paisa={-r.given} />
                      </td>
                      <td className="num">
                        <Money paisa={r.recovered} />
                      </td>
                      <td className="num font-medium">
                        <Money paisa={r.net} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "expenseRecoveryVsPaid" && (
            <div>
              <ExportBar
                title={t("reports.expenseRecoveryVsPaid")}
                columns={[
                  { header: t("bilti.expenseHead"), key: "head" },
                  { header: t("reports.paid"), key: "paid", isMoney: true },
                ]}
                rows={props.expenseVsPaid.rows}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("bilti.expenseHead")}</th>
                    <th className="num">{t("reports.paid")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.expenseVsPaid.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.head}</td>
                      <td className="num">
                        <Money paisa={r.paid} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>{t("reports.totalPaid")}</td>
                    <td className="num">
                      <Money paisa={props.expenseVsPaid.totalPaid} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("reports.recoveredChargedToVendors")}</td>
                    <td className="num">
                      <Money paisa={props.expenseVsPaid.recovered} />
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td>{t("reports.gainOrLoss")}</td>
                    <td className="num">
                      <Money paisa={props.expenseVsPaid.gainOrLoss} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {active === "biltiProfitability" && (
            <div>
              <ExportBar
                title={t("reports.biltiProfitability")}
                columns={[
                  { header: t("vocab.bilti"), key: "biltiNo" },
                  { header: t("reports.truck"), key: "truckNo" },
                  { header: t("common.date"), key: "date" },
                  { header: t("common.item"), key: "itemName" },
                  { header: t("common.crates"), key: "totalCrates" },
                  { header: t("bilti.soldCrates"), key: "soldCrates" },
                  { header: t("vocab.commission"), key: "commission", isMoney: true },
                  { header: t("reports.expenseRecovery"), key: "expenseRecovery", isMoney: true },
                ]}
                rows={props.biltiProfitability}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("vocab.bilti")}</th>
                    <th>{t("vocab.truckNo")}</th>
                    <th>{t("common.date")}</th>
                    <th>{t("common.item")}</th>
                    <th className="num">{t("common.crates")}</th>
                    <th className="num">{t("vocab.commission")}</th>
                    <th className="num">{t("reports.expenseRecovery")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.biltiProfitability.map((b) => (
                    <tr key={b.biltiNo}>
                      <td>{b.biltiNo}</td>
                      <td>{b.truckNo}</td>
                      <td>{format(new Date(b.date), "dd MMM yyyy")}</td>
                      <td>{b.itemName}</td>
                      <td className="num">
                        {b.soldCrates}/{b.totalCrates}
                      </td>
                      <td className="num">
                        <Money paisa={b.commission} />
                      </td>
                      <td className="num">
                        <Money paisa={b.expenseRecovery} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "farmProfitLoss" && (
            <div>
              <ExportBar
                title={t("reports.farmProfitLoss")}
                columns={[
                  { header: t("reports.farm"), key: "name" },
                  { header: t("farm.season"), key: "season" },
                  { header: t("reports.rent"), key: "rentAmount", isMoney: true },
                  { header: t("farm.expenses"), key: "totalExpenses", isMoney: true },
                  { header: t("account.typeIncome"), key: "totalDispatchIncome", isMoney: true },
                  { header: t("reports.net"), key: "netResult", isMoney: true },
                ]}
                rows={props.farms}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("common.name")}</th>
                    <th>{t("farm.season")}</th>
                    <th className="num">{t("farm.rentAmount")}</th>
                    <th className="num">{t("farm.expenses")}</th>
                    <th className="num">{t("farm.dispatches")}</th>
                    <th className="num">{t("farm.netResult")}</th>
                  </tr>
                </thead>
                <tbody>
                  {props.farms.map((f, i) => (
                    <tr key={i}>
                      <td>{f.name}</td>
                      <td>{f.season}</td>
                      <td className="num">
                        <Money paisa={f.rentAmount} />
                      </td>
                      <td className="num">
                        <Money paisa={f.totalExpenses} />
                      </td>
                      <td className="num">
                        <Money paisa={f.totalDispatchIncome} />
                      </td>
                      <td className="num font-medium">
                        <Money paisa={f.netResult} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === "seasonClosing" && (
            <div>
              <ExportBar
                title={t("reports.seasonClosing")}
                columns={[
                  { header: t("reports.metric"), key: "metric" },
                  { header: t("common.amount"), key: "amount", isMoney: true },
                ]}
                rows={[
                  { metric: t("reports.commissionIncome"), amount: props.seasonClosing.commission },
                  { metric: t("dashboard.netRateDifference"), amount: props.seasonClosing.netRateDifference },
                  { metric: t("reports.expenseGainLoss"), amount: props.seasonClosing.expenseGainOrLoss },
                  { metric: t("reports.farmNetResult"), amount: props.seasonClosing.farmNetTotal },
                  { metric: t("reports.totalVendorPayableClosing"), amount: props.seasonClosing.totalVendorPayable },
                  { metric: t("reports.totalCustomerReceivableClosing"), amount: props.seasonClosing.totalCustomerReceivable },
                ]}
              />
              <table className="ledger-table max-w-lg">
                <tbody>
                  <tr>
                    <td>{t("reports.commissionIncome")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.commission} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("dashboard.netRateDifference")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.netRateDifference} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("reports.expenseGainLoss")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.expenseGainOrLoss} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("reports.farmNetResult")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.farmNetTotal} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("reports.totalVendorPayableClosing")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.totalVendorPayable} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("reports.totalCustomerReceivableClosing")}</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.totalCustomerReceivable} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {active === "cancelledSales" && (
            <div>
              <ExportBar
                title={t("reports.cancelledSales")}
                columns={[
                  { header: t("common.date"), key: "date" },
                  { header: t("reports.lot"), key: "lotName" },
                  { header: "Bilti", key: "biltiNo" },
                  { header: t("reports.vendor"), key: "vendorName" },
                  { header: t("customer.title"), key: "customerName" },
                  { header: t("common.crates"), key: "crates" },
                  { header: t("vocab.actualRate"), key: "actualRate", isMoney: true },
                  { header: t("reports.cancelledAt"), key: "cancelledAt" },
                  { header: t("reports.cancelledBy"), key: "cancelledBy" },
                ]}
                rows={props.cancelledSales}
              />
              {props.cancelledSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("reports.noCancelledSales")}</p>
              ) : (
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>{t("common.date")}</th>
                      <th>{t("reports.lot")}</th>
                      <th>Bilti</th>
                      <th>{t("reports.vendor")}</th>
                      <th>{t("customer.title")}</th>
                      <th className="num">{t("common.crates")}</th>
                      <th className="num">{t("vocab.actualRate")}</th>
                      <th>{t("reports.cancelledAt")}</th>
                      <th>{t("reports.cancelledBy")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.cancelledSales.map((s) => (
                      <tr key={s.id}>
                        <td className="text-xs text-muted-foreground">{format(new Date(s.date), "dd MMM yyyy")}</td>
                        <td>{s.lotName}</td>
                        <td className="text-xs text-muted-foreground">{s.biltiNo}</td>
                        <td>{s.vendorName}</td>
                        <td>{s.customerName}</td>
                        <td className="num">{s.crates}</td>
                        <td className="num">
                          <Money paisa={s.actualRate} />
                        </td>
                        <td className="text-xs text-muted-foreground">{format(new Date(s.cancelledAt), "dd MMM yyyy, HH:mm")}</td>
                        <td>{s.cancelledBy ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
