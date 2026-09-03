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
}

const REPORTS = [
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
  const [active, setActive] = useState<ReportKey>("trialBalance");

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
          {active === "trialBalance" && (
            <div>
              <ExportBar
                title={t("reports.trialBalance")}
                columns={[
                  { header: "Code", key: "code" },
                  { header: "Name", key: "name" },
                  { header: "Type", key: "type" },
                  { header: "Debit", key: "debit", isMoney: true },
                  { header: "Credit", key: "credit", isMoney: true },
                ]}
                rows={props.trialBalance.rows}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th className="num">Debit</th>
                    <th className="num">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {props.trialBalance.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td className="text-xs text-muted-foreground">{r.type}</td>
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
                  { header: "Code", key: "code" },
                  { header: "Name", key: "name" },
                  { header: "Balance", key: "balance", isMoney: true },
                ]}
                rows={props.vendorBalances}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
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
                  { header: "Code", key: "code" },
                  { header: "Name", key: "name" },
                  { header: "Balance", key: "balance", isMoney: true },
                ]}
                rows={props.customerBalances}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
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
                  { header: "Name", key: "name" },
                  { header: "0-7", key: "b0_7", isMoney: true },
                  { header: "8-15", key: "b8_15", isMoney: true },
                  { header: "16-30", key: "b16_30", isMoney: true },
                  { header: "30+", key: "b30plus", isMoney: true },
                  { header: "Total", key: "total", isMoney: true },
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
                  { header: "Vendor", key: "vendorName" },
                  { header: "Commission", key: "commission", isMoney: true },
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
              <p className="mt-2 text-xs text-muted-foreground">Last month to date. See Bilti Profitability for per-truck detail.</p>
            </div>
          )}

          {active === "rateDifferenceReport" && (
            <div>
              <ExportBar
                title={t("reports.rateDifferenceReport")}
                columns={[
                  { header: "Vendor", key: "name" },
                  { header: "Given", key: "given", isMoney: true },
                  { header: "Recovered", key: "recovered", isMoney: true },
                  { header: "Net", key: "net", isMoney: true },
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
                  { header: "Head", key: "head" },
                  { header: "Paid", key: "paid", isMoney: true },
                ]}
                rows={props.expenseVsPaid.rows}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Expense Head</th>
                    <th className="num">Paid</th>
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
                    <td>Total Paid</td>
                    <td className="num">
                      <Money paisa={props.expenseVsPaid.totalPaid} />
                    </td>
                  </tr>
                  <tr>
                    <td>Recovered (charged to vendors)</td>
                    <td className="num">
                      <Money paisa={props.expenseVsPaid.recovered} />
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td>Gain / (Loss)</td>
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
                  { header: "Bilti", key: "biltiNo" },
                  { header: "Truck", key: "truckNo" },
                  { header: "Date", key: "date" },
                  { header: "Item", key: "itemName" },
                  { header: "Crates", key: "totalCrates" },
                  { header: "Sold", key: "soldCrates" },
                  { header: "Commission", key: "commission", isMoney: true },
                  { header: "Expense Recovery", key: "expenseRecovery", isMoney: true },
                ]}
                rows={props.biltiProfitability}
              />
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("vocab.bilti")}</th>
                    <th>{t("vocab.truckNo")}</th>
                    <th>{t("common.date")}</th>
                    <th>Item</th>
                    <th className="num">{t("common.crates")}</th>
                    <th className="num">{t("vocab.commission")}</th>
                    <th className="num">Expense Recovery</th>
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
                  { header: "Farm", key: "name" },
                  { header: "Season", key: "season" },
                  { header: "Rent", key: "rentAmount", isMoney: true },
                  { header: "Expenses", key: "totalExpenses", isMoney: true },
                  { header: "Income", key: "totalDispatchIncome", isMoney: true },
                  { header: "Net", key: "netResult", isMoney: true },
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
                  { header: "Metric", key: "metric" },
                  { header: "Amount", key: "amount", isMoney: true },
                ]}
                rows={[
                  { metric: "Commission Income", amount: props.seasonClosing.commission },
                  { metric: "Net Rate Difference", amount: props.seasonClosing.netRateDifference },
                  { metric: "Expense Gain/(Loss)", amount: props.seasonClosing.expenseGainOrLoss },
                  { metric: "Farm Net Result", amount: props.seasonClosing.farmNetTotal },
                  { metric: "Total Vendor Payable", amount: props.seasonClosing.totalVendorPayable },
                  { metric: "Total Customer Receivable", amount: props.seasonClosing.totalCustomerReceivable },
                ]}
              />
              <table className="ledger-table max-w-lg">
                <tbody>
                  <tr>
                    <td>Commission Income</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.commission} />
                    </td>
                  </tr>
                  <tr>
                    <td>Net Rate Difference</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.netRateDifference} />
                    </td>
                  </tr>
                  <tr>
                    <td>Expense Gain / (Loss)</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.expenseGainOrLoss} />
                    </td>
                  </tr>
                  <tr>
                    <td>Farm Net Result</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.farmNetTotal} />
                    </td>
                  </tr>
                  <tr>
                    <td>Total Vendor Payable (closing)</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.totalVendorPayable} />
                    </td>
                  </tr>
                  <tr>
                    <td>Total Customer Receivable (closing)</td>
                    <td className="num">
                      <Money paisa={props.seasonClosing.totalCustomerReceivable} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
