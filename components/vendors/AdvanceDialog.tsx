"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { payVendorAdvanceAction } from "@/app/actions/cash";
import { HandCoins } from "lucide-react";
import { format } from "date-fns";

export function AdvanceDialog({ vendorId }: { vendorId: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: { amount: "", date: format(new Date(), "yyyy-MM-dd"), narration: "" },
  });

  async function onSubmit(values: { amount: string; date: string; narration: string }) {
    const res = await payVendorAdvanceAction({
      vendorId,
      amount: Number(values.amount),
      date: new Date(values.date),
      narration: values.narration || "Vendor advance",
      mode: "CASH",
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
          {t("advance.pay")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("advance.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">{t("common.amount")}</Label>
            <Input id="amount" type="number" step="0.01" autoFocus {...register("amount", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">{t("common.date")}</Label>
            <Input id="date" type="date" {...register("date", { required: true })} />
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
