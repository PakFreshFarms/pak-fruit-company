"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AccountCombobox, type ComboboxAccount } from "@/components/shared/AccountCombobox";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createCashEntryAction } from "@/app/actions/cash";
import { Plus } from "lucide-react";

interface FormValues {
  direction: "IN" | "OUT";
  accountId: string;
  amount: string;
  date: string;
  mode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
  reference: string;
  narration: string;
}

export function CashEntryDialog({ accounts, defaultDate }: { accounts: ComboboxAccount[]; defaultDate: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { direction: "OUT", accountId: "", amount: "", date: defaultDate.slice(0, 10), mode: "CASH", reference: "", narration: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!values.accountId) {
      toast.error(t("common.required"));
      return;
    }
    const res = await createCashEntryAction({
      date: new Date(values.date),
      book: "CASH",
      direction: values.direction,
      accountId: values.accountId,
      amount: Number(values.amount),
      mode: values.mode,
      reference: values.reference || undefined,
      narration: values.narration || (values.direction === "IN" ? "Cash received" : "Cash paid"),
    });
    if (res.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset({ ...values, accountId: "", amount: "", narration: "", reference: "" });
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {t("cash.addEntry")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cash.addEntry")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.type")}</Label>
              <Select value={watch("direction")} onValueChange={(v) => setValue("direction", v as FormValues["direction"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUT">{t("cash.out")}</SelectItem>
                  <SelectItem value="IN">{t("cash.in")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("common.reference")} account</Label>
            <AccountCombobox
              accounts={accounts}
              value={watch("accountId")}
              onChange={(id) => setValue("accountId", id)}
              placeholder="Select vendor, expense head, farm..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">{t("common.amount")}</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount", { required: true })} />
            </div>
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
