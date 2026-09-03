"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createBiltiAction } from "@/app/actions/bilti";
import { Plus } from "lucide-react";

interface FormValues {
  biltiNo: string;
  truckNo: string;
  date: string;
  itemName: string;
  totalCrates: string;
}

export function NewBiltiDialog() {
  const t = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { biltiNo: "", truckNo: "", date: format(new Date(), "yyyy-MM-dd"), itemName: "", totalCrates: "" },
  });

  async function onSubmit(values: FormValues) {
    const res = await createBiltiAction({
      biltiNo: values.biltiNo,
      truckNo: values.truckNo,
      date: new Date(values.date),
      itemName: values.itemName,
      totalCrates: Number(values.totalCrates),
    });
    if (res.ok && res.id) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset();
      router.push(`/bilti/${res.id}`);
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {t("bilti.addBilti")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bilti.addBilti")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biltiNo">{t("bilti.biltiNo")}</Label>
              <Input id="biltiNo" autoFocus {...register("biltiNo", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="truckNo">{t("bilti.truckNo")}</Label>
              <Input id="truckNo" {...register("truckNo", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input id="date" type="date" {...register("date", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="itemName">{t("bilti.itemName")}</Label>
              <Input id="itemName" placeholder="Mango" {...register("itemName", { required: true })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totalCrates">{t("bilti.totalCrates")}</Label>
            <Input id="totalCrates" type="number" {...register("totalCrates", { required: true })} />
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
