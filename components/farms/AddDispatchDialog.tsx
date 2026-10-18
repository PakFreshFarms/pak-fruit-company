"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createFarmDispatchAction } from "@/app/actions/farm";
import { Plus } from "lucide-react";

interface FormValues {
  date: string;
  truckNo: string;
  crates: string;
  marketName: string;
  chargeCommission: boolean;
}

export function AddDispatchDialog({ farmId }: { farmId: string }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), truckNo: "", crates: "", marketName: "", chargeCommission: false },
  });

  async function onSubmit(values: FormValues) {
    const res = await createFarmDispatchAction({
      farmId,
      date: new Date(values.date),
      truckNo: values.truckNo,
      crates: Number(values.crates),
      marketName: values.marketName || undefined,
      chargeCommission: values.chargeCommission,
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
        <Button size="sm">
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("farm.dispatches")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="truckNo">{t("vocab.truckNo")}</Label>
              <Input id="truckNo" autoFocus {...register("truckNo", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crates">{t("common.crates")}</Label>
              <Input id="crates" type="number" {...register("crates", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="marketName">{t("common.market")}</Label>
              <Input id="marketName" {...register("marketName")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="chargeCommission" checked={watch("chargeCommission")} onCheckedChange={(v) => setValue("chargeCommission", !!v)} />
            <Label htmlFor="chargeCommission">{t("farm.chargeCommission")}</Label>
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
