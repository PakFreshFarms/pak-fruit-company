"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteSaleAction } from "@/app/actions/sales";
import { X } from "lucide-react";

interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  crates: number;
  actualRate: number;
}

interface LotData {
  id: string;
  name: string;
  crates: number;
  reportRate: number;
  soldCrates: number;
  sales: Sale[];
}

export function LotBlock({ biltiId, lot, voucherComplete }: { biltiId: string; lot: LotData; voucherComplete: boolean }) {
  const t = useTranslation();
  const remaining = lot.crates - lot.soldCrates;

  async function handleDelete(saleId: string) {
    const res = await deleteSaleAction(saleId, biltiId);
    if (!res.ok) toast.error(res.error ?? t("common.error"));
  }

  return (
    <div className="mb-3 rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div className="text-sm font-medium">{lot.name}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {t("vocab.reportRate")}: <Money paisa={lot.reportRate} className="font-medium text-foreground" />
          </span>
          <Badge variant={remaining === 0 ? "success" : "outline"}>
            {lot.soldCrates}/{lot.crates} {t("common.crates")}
          </Badge>
        </div>
      </div>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>{t("common.date")}</th>
            <th>{t("customer.title")}</th>
            <th>{t("common.crates")}</th>
            <th>{t("vocab.actualRate")}</th>
            <th className="num">{t("common.amount")}</th>
            <th className="num">{t("vocab.rateDifference")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lot.sales.map((s) => {
            const diff = (s.actualRate - lot.reportRate) * s.crates;
            return (
              <tr key={s.id}>
                <td className="text-xs text-muted-foreground">{format(new Date(s.date), "dd MMM")}</td>
                <td>{s.customerName}</td>
                <td>{s.crates}</td>
                <td>
                  <Money paisa={s.actualRate} />
                </td>
                <td className="num">
                  <Money paisa={s.actualRate * s.crates} />
                </td>
                <td className="num">
                  {diff !== 0 && (
                    <span className={diff < 0 ? "text-danger" : "text-success"}>
                      <Money paisa={diff} />
                    </span>
                  )}
                </td>
                <td>
                  {!voucherComplete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-6" title={t("common.reverse")}>
                          <X className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("common.confirmDeleteSaleTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("common.confirmDeleteSaleDescription")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(s.id)}>{t("common.confirm")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
