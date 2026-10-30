"use client";

import { format } from "date-fns";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/Money";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Printer } from "lucide-react";

export interface ReceiptSale {
  date: string;
  biltiNo: string;
  truckNo: string;
  lotName: string;
  customerName: string;
  crates: number;
  actualRate: number;
}

/**
 * Printable customer receipt, triggered directly from a just-entered sale
 * row — the buyer is standing there when the line is entered, so this opens
 * in a dialog rather than navigating away from the live entry page.
 */
export function SaleReceipt({ shopName, shopAddress, sale }: { shopName: string; shopAddress: string; sale: ReceiptSale }) {
  const t = useTranslation();
  const amount = sale.crates * sale.actualRate;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title={t("bilti.printReceipt")}>
          <Printer className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle className="sr-only">{t("bilti.printReceipt")}</DialogTitle>
        <div className="no-print flex justify-end">
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            {t("common.print_a4")}
          </Button>
        </div>
        <div className="print-area border border-border bg-card p-6 text-base">
          <div className="mb-4 text-center">
            <div className="text-lg font-bold">{shopName}</div>
            {shopAddress && <div className="text-sm text-muted-foreground">{shopAddress}</div>}
            <div className="mt-2 text-base font-semibold">{t("bilti.receiptTitle")}</div>
          </div>
          <div className="mb-3 flex justify-between text-sm">
            <span>{format(new Date(sale.date), "dd MMM yyyy, HH:mm")}</span>
            <span>
              {sale.biltiNo} · {sale.truckNo}
            </span>
          </div>
          <table className="ledger-table mb-3">
            <tbody>
              <tr>
                <td>{t("vocab.customer")}</td>
                <td className="num font-semibold">{sale.customerName}</td>
              </tr>
              <tr>
                <td>{t("bilti.lots")}</td>
                <td className="num">{sale.lotName}</td>
              </tr>
              <tr>
                <td>{t("common.crates")}</td>
                <td className="num">{sale.crates}</td>
              </tr>
              <tr>
                <td>{t("vocab.actualRate")}</td>
                <td className="num">
                  <Money paisa={sale.actualRate} />
                </td>
              </tr>
              <tr className="font-bold">
                <td>{t("common.amount")}</td>
                <td className="num">
                  <Money paisa={amount} />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-center text-sm text-muted-foreground">{t("bilti.receiptThanks")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
