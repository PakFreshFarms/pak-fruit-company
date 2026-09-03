"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { addLotAction } from "@/app/actions/bilti";
import { Plus } from "lucide-react";

interface FormValues {
  name: string;
  crates: string;
  reportRate: string;
}

export function AddLotDialog({ biltiId, voucherId, unassignedCrates }: { biltiId: string; voucherId: string; unassignedCrates: number }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({ defaultValues: { name: "", crates: "", reportRate: "" } });

  async function onSubmit(values: FormValues) {
    const res = await addLotAction({
      voucherId,
      biltiId,
      name: values.name,
      crates: Number(values.crates),
      reportRate: Number(values.reportRate),
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
        <Button size="sm" variant="ghost">
          <Plus className="size-4" />
          {t("bilti.addLot")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bilti.addLot")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {t("bilti.unassignedCrates")}: {unassignedCrates}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("bilti.lotName")}</Label>
            <Input id="name" autoFocus placeholder="Mosami Chaunsa" {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crates">{t("common.crates")}</Label>
              <Input id="crates" type="number" {...register("crates", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reportRate">{t("vocab.reportRate")}</Label>
              <Input id="reportRate" type="number" step="0.01" {...register("reportRate", { required: true })} />
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
