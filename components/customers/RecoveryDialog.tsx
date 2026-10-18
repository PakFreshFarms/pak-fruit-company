"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createCashEntryAction } from "@/app/actions/cash";
import { HandCoins } from "lucide-react";

interface FormValues {
  amount: string;
  date: string;
  mode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
  reference: string;
  narration: string;
}

export function RecoveryDialog({ customerId, triggerLabel }: { customerId: string; triggerLabel?: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { amount: "", date: format(new Date(), "yyyy-MM-dd"), mode: "CASH", reference: "", narration: "" },
  });

  async function onSubmit(values: FormValues) {
    const res = await createCashEntryAction({
      date: new Date(values.date),
      book: "WASOOLI",
      direction: "IN",
      accountId: customerId,
      amount: Number(values.amount),
      mode: values.mode,
      reference: values.reference || undefined,
      narration: values.narration || undefined,
    });
    if (res.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset();
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <HandCoins className="size-4" />
          {triggerLabel ?? t("wasooli.addEntry")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("wasooli.addEntry")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">{t("common.amount")}</Label>
              <Input id="amount" type="number" step="0.01" autoFocus {...register("amount", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.mode")}</Label>
              <Select value={watch("mode")} onValueChange={(v) => setValue("mode", v as FormValues["mode"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["CASH", "BANK", "CHEQUE", "ONLINE"] as const).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reference">{t("common.reference")}</Label>
              <Input id="reference" {...register("reference")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="narration">{t("common.narration")}</Label>
            <Input id="narration" {...register("narration")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
