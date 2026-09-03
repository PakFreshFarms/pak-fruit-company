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
import { createFarmAction } from "@/app/actions/farm";
import { Plus } from "lucide-react";

interface FormValues {
  name: string;
  season: string;
  landownerName: string;
  rentAmount: string;
  startDate: string;
}

export function NewFarmDialog() {
  const t = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { name: "", season: "", landownerName: "", rentAmount: "", startDate: format(new Date(), "yyyy-MM-dd") },
  });

  async function onSubmit(values: FormValues) {
    const res = await createFarmAction({
      name: values.name,
      season: values.season,
      landownerName: values.landownerName,
      rentAmount: Number(values.rentAmount) || 0,
      startDate: new Date(values.startDate),
    });
    if (res.ok && res.id) {
      toast.success(t("common.saved"));
      setOpen(false);
      reset();
      router.push(`/farms/${res.id}`);
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {t("farm.addFarm")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("farm.addFarm")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" autoFocus {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="season">{t("farm.season")}</Label>
              <Input id="season" placeholder="2026 Mango" {...register("season", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="landownerName">{t("farm.landowner")}</Label>
              <Input id="landownerName" {...register("landownerName", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rentAmount">{t("farm.rentAmount")}</Label>
              <Input id="rentAmount" type="number" step="0.01" {...register("rentAmount", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">{t("common.date")}</Label>
              <Input id="startDate" type="date" {...register("startDate", { required: true })} />
            </div>
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
