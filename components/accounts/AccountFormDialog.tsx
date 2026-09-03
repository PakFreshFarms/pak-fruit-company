"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createAccountAction } from "@/app/actions/accounts";
import { Plus } from "lucide-react";
import type { AccountType } from "@prisma/client";

interface FormValues {
  code: string;
  name: string;
  nameUr: string;
  type: AccountType;
  openingBalance: number;
  phone: string;
  address: string;
  notes: string;
}

const ACCOUNT_TYPES: AccountType[] = ["VENDOR", "CUSTOMER", "CASH", "BANK", "EXPENSE", "INCOME", "ASSET", "LIABILITY", "CAPITAL", "FARM"];

export function AccountFormDialog({
  fixedType,
  triggerLabel,
  onCreated,
}: {
  fixedType?: AccountType;
  triggerLabel?: string;
  onCreated?: () => void;
}) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    defaultValues: { code: "", name: "", nameUr: "", type: fixedType ?? "VENDOR", openingBalance: 0, phone: "", address: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!values.code.trim() || !values.name.trim()) {
      toast.error(t("common.required"));
      return;
    }
    const result = await createAccountAction({ ...values, openingBalance: Number(values.openingBalance) || 0 });
    if (result.ok) {
      toast.success(t("common.saved"));
      setOpen(false);
      form.reset({ ...values, code: "", name: "", nameUr: "", openingBalance: 0, phone: "", address: "", notes: "" });
      onCreated?.();
    } else {
      toast.error(result.error ?? t("common.error"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) form.reset({ code: "", name: "", nameUr: "", type: fixedType ?? "VENDOR", openingBalance: 0, phone: "", address: "", notes: "" });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {triggerLabel ?? t("account.addAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{triggerLabel ?? t("account.addAccount")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t("common.code")}</Label>
              <Input id="code" autoFocus {...form.register("code")} />
            </div>
            {!fixedType && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("common.type")}</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>
                        {t(`account.type${ty.charAt(0)}${ty.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("common.name")} (English)</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nameUr">{t("common.name")} (اردو)</Label>
              <Input id="nameUr" dir="rtl" className="font-urdu" {...form.register("nameUr")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{t("common.phone")}</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="openingBalance">{t("common.openingBalance")}</Label>
              <Input id="openingBalance" type="number" step="0.01" {...form.register("openingBalance")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">{t("common.address")}</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
