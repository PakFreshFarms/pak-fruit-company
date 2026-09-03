"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { recordDispatchSaleAction } from "@/app/actions/farm";

export function RecordSaleDialog({ farmId, dispatchId, truckNo }: { farmId: string; dispatchId: string; truckNo: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await recordDispatchSaleAction({ dispatchId, farmId, netSaleAmount: Number(amount) });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      setAmount("");
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {t("farm.netSaleAmount")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("farm.netSaleAmount")} — {truckNo}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="netSale">{t("farm.netSaleAmount")}</Label>
          <Input id="netSale" type="number" step="0.01" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!amount || submitting}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
