"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { AccountCombobox } from "@/components/shared/AccountCombobox";
import { createCashEntryAction } from "@/app/actions/cash";
import { HandCoins } from "lucide-react";

interface CustomerOpt {
  id: string;
  name: string;
  code: string;
  balance: number;
}

interface Entry {
  id: string;
  date: string;
  customerName: string;
  amount: number;
  mode: string;
  reference: string | null;
  narration: string;
}

interface FormValues {
  customerId: string;
  amount: string;
  date: string;
  mode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
  reference: string;
  narration: string;
}

export function WasooliView({ entries, customers }: { entries: Entry[]; customers: CustomerOpt[] }) {
  const t = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { customerId: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), mode: "CASH", reference: "", narration: "" },
  });

  const selectedCustomer = customers.find((c) => c.id === watch("customerId"));

  async function onSubmit(values: FormValues) {
    if (!values.customerId) {
      toast.error(t("common.required"));
      return;
    }
    setSubmitting(true);
    const res = await createCashEntryAction({
      date: new Date(values.date),
      book: "WASOOLI",
      direction: "IN",
      accountId: values.customerId,
      amount: Number(values.amount),
      mode: values.mode,
      reference: values.reference || undefined,
      narration: values.narration || "Wasooli recovery",
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("common.saved"));
      reset({ customerId: "", amount: "", date: values.date, mode: "CASH", reference: "", narration: "" });
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <div>
      <PageHeader title={t("wasooli.title")} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 grid grid-cols-1 items-end gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-6"
      >
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">{t("customer.title")}</label>
          <AccountCombobox
            accounts={customers}
            value={watch("customerId")}
            onChange={(id) => setValue("customerId", id)}
            placeholder="Select customer"
          />
          {selectedCustomer && (
            <div className="text-xs text-muted-foreground">
              {t("wasooli.customerOutstanding")}: <Money paisa={selectedCustomer.balance} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("common.amount")}</label>
          <Input type="number" step="0.01" {...register("amount", { required: true })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("common.date")}</label>
          <Input type="date" {...register("date", { required: true })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("common.reference")}</label>
          <Input {...register("reference")} />
        </div>
        <Button type="submit" disabled={submitting}>
          <HandCoins className="size-4" />
          {t("wasooli.addEntry")}
        </Button>
      </form>

      {entries.length === 0 ? (
        <EmptyState icon={HandCoins} title={t("common.noResults")} instruction="Record a recovery above when a customer pays." />
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>{t("common.date")}</th>
              <th>{t("customer.title")}</th>
              <th>{t("common.mode")}</th>
              <th>{t("common.reference")}</th>
              <th className="num">{t("common.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{format(new Date(e.date), "dd MMM yyyy")}</td>
                <td>{e.customerName}</td>
                <td className="text-xs text-muted-foreground">{e.mode}</td>
                <td className="text-xs text-muted-foreground">{e.reference ?? "—"}</td>
                <td className="num">
                  <Money paisa={e.amount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
