"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createFarmExpenseAction } from "@/app/actions/farm";
import { Plus } from "lucide-react";

const HEADS = ["Mazdoori", "Loading", "Spray", "Khaad", "Diesel", "Chowkidar", "Packing", "Transport", "Other"];

interface FormValues {
  date: string;
  head: string;
  payeeName: string;
  amount: string;
  narration: string;
}

export function AddExpenseDialog({ farmId }: { farmId: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), head: "Mazdoori", payeeName: "", amount: "", narration: "" },
  });

  async function onSubmit(values: FormValues) {
    const res = await createFarmExpenseAction({
      farmId,
      date: new Date(values.date),
      head: values.head,
      payeeName: values.payeeName || undefined,
      amount: Number(values.amount),
      narration: values.narration || undefined,
    });
    if (res.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset({ date: values.date, head: values.head, payeeName: "", amount: "", narration: "" });
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("farm.expenses")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="head">{t("farm.head")}</Label>
              <select id="head" className="h-9 rounded-md border border-input bg-card px-3 text-sm" {...register("head", { required: true })}>
                {HEADS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payeeName">{t("farm.payee")}</Label>
              <Input id="payeeName" autoFocus {...register("payeeName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">{t("common.amount")}</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount", { required: true })} />
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
