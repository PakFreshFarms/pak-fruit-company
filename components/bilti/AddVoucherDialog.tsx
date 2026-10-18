"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AccountCombobox, type ComboboxAccount } from "@/components/shared/AccountCombobox";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { addVoucherAction } from "@/app/actions/bilti";
import { Plus } from "lucide-react";

interface FormValues {
  voucherNo: string;
  vendorId: string;
  crates: string;
  kirayaOverride: string;
}

export function AddVoucherDialog({ biltiId, vendors, unassignedCrates }: { biltiId: string; vendors: ComboboxAccount[]; unassignedCrates: number }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { voucherNo: "", vendorId: "", crates: "", kirayaOverride: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!values.vendorId) {
      toast.error(t("common.required"));
      return;
    }
    const res = await addVoucherAction({
      biltiId,
      voucherNo: values.voucherNo,
      vendorId: values.vendorId,
      crates: Number(values.crates),
      kirayaOverride: values.kirayaOverride ? Number(values.kirayaOverride) : undefined,
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
          <Plus className="size-4" />
          {t("bilti.addVoucher")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bilti.addVoucher")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {t("bilti.unassignedCrates")}: {unassignedCrates}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="voucherNo">{t("bilti.voucherNo")}</Label>
            <Input id="voucherNo" autoFocus {...register("voucherNo", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("vocab.vendor")}</Label>
            <AccountCombobox
              accounts={vendors}
              value={watch("vendorId")}
              onChange={(id) => setValue("vendorId", id)}
              placeholder="Select vendor"
              allowCreate={{ type: "VENDOR" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crates">{t("common.crates")}</Label>
              <Input id="crates" type="number" {...register("crates", { required: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kirayaOverride">{t("bilti.kirayaOverride")}</Label>
              <Input id="kirayaOverride" type="number" step="0.01" placeholder={t("bilti.useBiltiRate")} {...register("kirayaOverride")} />
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
