"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { QuickExpenseDialog } from "./QuickExpenseDialog";
import { AddDispatchDialog } from "./AddDispatchDialog";
import { RecordSaleDialog } from "./RecordSaleDialog";
import { payFarmRentAction, closeFarmSeasonAction } from "@/app/actions/farm";

interface Expense {
  id: string;
  date: string;
  head: string;
  payeeName: string | null;
  amount: number;
  narration: string | null;
}

interface Dispatch {
  id: string;
  date: string;
  truckNo: string;
  crates: number;
  netSaleAmount: number;
  marketName: string | null;
  status: string;
  chargeCommission: boolean;
}

interface Summary {
  expensesByHead: { head: string; amount: number }[];
  totalExpenses: number;
  totalDispatchIncome: number;
  receivedCrates: number;
  netResult: number;
  costPerCrate: number;
  realisationPerCrate: number;
}

export function FarmDetailView({
  farm,
  expenses,
  dispatches,
  summary,
  isOwner,
}: {
  farm: { id: string; name: string; season: string; landownerName: string; rentAmount: number; rentPaid: number; isClosed: boolean };
  expenses: Expense[];
  dispatches: Dispatch[];
  summary: Summary;
  isOwner: boolean;
}) {
  const t = useTranslation();
  const [rentAmount, setRentAmount] = useState("");
  const [payingRent, setPayingRent] = useState(false);
  const [closing, setClosing] = useState(false);
  const rentDue = farm.rentAmount - farm.rentPaid;

  async function payRent() {
    setPayingRent(true);
    const res = await payFarmRentAction({ farmId: farm.id, amount: Number(rentAmount), date: new Date() });
    setPayingRent(false);
    if (res.ok) {
      toast.success(t("common.saved"));
      setRentAmount("");
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  async function closeSeason() {
    setClosing(true);
    const res = await closeFarmSeasonAction(farm.id);
    setClosing(false);
    if (res.ok) toast.success(t("common.saved"));
    else toast.error(res.error ?? t("common.error"));
  }

  return (
    <div>
      <PageHeader
        title={farm.name}
        subtitle={`${farm.season} · ${farm.landownerName}`}
        actions={
          !farm.isClosed && isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={closing}>
                  {t("farm.closeSeason")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("farm.confirmCloseSeasonTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("farm.confirmCloseSeasonDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={closeSeason}>{t("common.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : farm.isClosed ? (
            <Badge variant="outline">{t("farm.seasonClosed")}</Badge>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">{t("farm.rentAmount")}</div>
            <div className="text-lg font-semibold tabular-nums">
              <Money paisa={farm.rentAmount} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">{t("farm.rentPaid")}</div>
            <div className="text-lg font-semibold tabular-nums">
              <Money paisa={farm.rentPaid} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-end justify-between gap-2 py-4">
            <div>
              <div className="text-xs text-muted-foreground">{t("farm.rentDue")}</div>
              <div className="text-lg font-semibold tabular-nums">
                <Money paisa={rentDue} />
              </div>
            </div>
            {rentDue > 0 && (
              <div className="flex gap-1">
                <Input type="number" className="h-8 w-24" placeholder="Amount" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
                <Button size="sm" onClick={payRent} disabled={!rentAmount || payingRent}>
                  {t("common.save")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">{t("farm.netResult")}</div>
            <div className="text-lg font-semibold tabular-nums">
              <Money paisa={summary.netResult} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">{t("farm.expenses")}</TabsTrigger>
          <TabsTrigger value="dispatches">{t("farm.dispatches")}</TabsTrigger>
          <TabsTrigger value="summary">{t("farm.summary")}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <div className="mb-3 flex justify-end gap-2">
            <QuickExpenseDialog farmId={farm.id} />
            <AddExpenseDialog farmId={farm.id} />
          </div>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>{t("common.date")}</th>
                <th>{t("farm.head")}</th>
                <th>{t("farm.payee")}</th>
                <th>{t("common.narration")}</th>
                <th className="num">{t("common.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{format(new Date(e.date), "dd MMM yyyy")}</td>
                  <td>{e.head}</td>
                  <td>{e.payeeName ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{e.narration ?? ""}</td>
                  <td className="num">
                    <Money paisa={e.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="dispatches">
          <div className="mb-3 flex justify-end">
            <AddDispatchDialog farmId={farm.id} />
          </div>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>{t("common.date")}</th>
                <th>{t("vocab.truckNo")}</th>
                <th>{t("common.crates")}</th>
                <th>{t("common.status")}</th>
                <th className="num">{t("farm.netSaleAmount")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((d) => (
                <tr key={d.id}>
                  <td>{format(new Date(d.date), "dd MMM yyyy")}</td>
                  <td>{d.truckNo}</td>
                  <td>{d.crates}</td>
                  <td>
                    <Badge variant={d.status === "RECEIVED" ? "success" : "outline"}>{d.status}</Badge>
                  </td>
                  <td className="num">{d.status === "RECEIVED" ? <Money paisa={d.netSaleAmount} /> : "—"}</td>
                  <td>{d.status === "PENDING" && <RecordSaleDialog farmId={farm.id} dispatchId={d.id} truckNo={d.truckNo} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("farm.expenses")} by head</h4>
              <table className="ledger-table">
                <tbody>
                  {summary.expensesByHead.map((e) => (
                    <tr key={e.head}>
                      <td>{e.head}</td>
                      <td className="num">
                        <Money paisa={e.amount} />
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td>{t("common.total")}</td>
                    <td className="num">
                      <Money paisa={summary.totalExpenses} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("farm.result")}</h4>
              <table className="ledger-table">
                <tbody>
                  <tr>
                    <td>{t("farm.dispatches")} income</td>
                    <td className="num">
                      <Money paisa={summary.totalDispatchIncome} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("farm.expenses")}</td>
                    <td className="num">
                      <Money paisa={summary.totalExpenses} />
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td>{t("farm.netResult")}</td>
                    <td className="num">
                      <Money paisa={summary.netResult} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("farm.costPerCrate")}</td>
                    <td className="num">
                      <Money paisa={summary.costPerCrate} />
                    </td>
                  </tr>
                  <tr>
                    <td>{t("farm.realisationPerCrate")}</td>
                    <td className="num">
                      <Money paisa={summary.realisationPerCrate} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
