"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createFarmExpenseBatchAction } from "@/app/actions/farm";
import { Plus, Trash2, Users } from "lucide-react";

const HEADS = ["Mazdoori", "Loading", "Spray", "Khaad", "Diesel", "Chowkidar", "Packing", "Transport", "Other"];

interface FormValues {
  date: string;
  head: string;
  lines: { payeeName: string; amount: string }[];
}

export function QuickExpenseDialog({ farmId }: { farmId: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, control, formState } = useForm<FormValues>({
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), head: "Mazdoori", lines: [{ payeeName: "", amount: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  async function onSubmit(values: FormValues) {
    const lines = values.lines.filter((l) => l.payeeName && l.amount).map((l) => ({ payeeName: l.payeeName, amount: Number(l.amount) }));
    if (lines.length === 0) {
      toast.error(t("common.required"));
      return;
    }
    const res = await createFarmExpenseBatchAction({ farmId, date: new Date(values.date), head: values.head, lines });
    if (res.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset({ date: values.date, head: values.head, lines: [{ payeeName: "", amount: "" }] });
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Users className="size-4" />
          {t("farm.quickEntry")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("farm.quickEntry")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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

          <div className="flex flex-col gap-2">
            <Label>{t("farm.payee")} / {t("common.amount")}</Label>
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder={t("farm.payee")} {...register(`lines.${i}.payeeName`)} />
                <Input type="number" step="0.01" placeholder={t("common.amount")} className="w-32" {...register(`lines.${i}.amount`)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ payeeName: "", amount: "" })} className="self-start">
              <Plus className="size-4" /> Row
            </Button>
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
