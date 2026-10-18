"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { updateSettingsAction, createUserAction, backupNowAction, restoreAction } from "@/app/actions/settings";
import { Download, Save, UserPlus } from "lucide-react";

interface SettingsFormValues {
  shopName: string;
  shopAddress: string;
  commissionRatePercent: string;
  financialYear: string;
}

interface UserRow {
  id: string;
  name: string;
  role: "OWNER" | "MUNSHI";
  isActive: boolean;
}

interface BackupRow {
  id: string;
  filePath: string;
  createdAt: string;
  sizeBytes: number;
  auto: boolean;
}

export function SettingsView({
  shopName,
  shopAddress,
  financialYear,
  commissionRate,
  users,
  backups,
}: {
  shopName: string;
  shopAddress: string;
  financialYear: string;
  commissionRate: number;
  users: UserRow[];
  backups: BackupRow[];
}) {
  const t = useTranslation();
  const { register, handleSubmit, formState } = useForm<SettingsFormValues>({
    defaultValues: { shopName, shopAddress, commissionRatePercent: String(commissionRate), financialYear },
  });

  const [userForm, setUserForm] = useState({ name: "", role: "MUNSHI" as "OWNER" | "MUNSHI", pin: "" });
  const [backingUp, setBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  async function onSubmit(values: SettingsFormValues) {
    const res = await updateSettingsAction({ ...values, commissionRatePercent: Number(values.commissionRatePercent) });
    if (res.ok) toast.success(t("common.saved"));
    else toast.error(res.error ?? t("common.error"));
  }

  async function addUser() {
    if (!userForm.name || userForm.pin.length < 4) {
      toast.error(t("common.required"));
      return;
    }
    const res = await createUserAction(userForm);
    if (res.ok) {
      toast.success(t("common.saved"));
      setUserForm({ name: "", role: "MUNSHI", pin: "" });
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  async function doBackup() {
    setBackingUp(true);
    const res = await backupNowAction();
    setBackingUp(false);
    if (res.ok) toast.success(t("common.saved"));
    else toast.error(res.error ?? t("common.error"));
  }

  async function doRestore() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error(t("common.required"));
      return;
    }
    setRestoring(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await restoreAction(formData);
    setRestoring(false);
    if (res.ok) toast.success("Restored. Please restart the application.");
    else toast.error(res.error ?? t("common.error"));
  }

  return (
    <div>
      <PageHeader title={t("settings.title")} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shopName">{t("settings.shopName")}</Label>
                <Input id="shopName" {...register("shopName", { required: true })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shopAddress">{t("settings.shopAddress")}</Label>
                <Input id="shopAddress" {...register("shopAddress")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="commissionRatePercent">{t("settings.commissionRate")}</Label>
                  <Input id="commissionRatePercent" type="number" step="0.1" {...register("commissionRatePercent", { required: true })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="financialYear">{t("settings.financialYear")}</Label>
                  <Input id="financialYear" placeholder="2026-27" {...register("financialYear")} />
                </div>
              </div>
              <Button type="submit" className="self-start" disabled={formState.isSubmitting}>
                <Save className="size-4" />
                {t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="ledger-table mb-3">
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>
                      <Badge variant="outline">{u.role}</Badge>
                    </td>
                    <td>{u.isActive ? t("common.active") : t("common.inactive")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2">
              <Input placeholder={t("common.name")} value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
              <select
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "OWNER" | "MUNSHI" })}
              >
                <option value="MUNSHI">MUNSHI</option>
                <option value="OWNER">OWNER</option>
              </select>
              <Input placeholder="PIN" type="password" className="w-20" value={userForm.pin} onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })} />
              <Button size="icon" onClick={addUser}>
                <UserPlus className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("settings.backup")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Button onClick={doBackup} disabled={backingUp}>
                {t("settings.backupNow")}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">{t("settings.restore")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.restore")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("settings.restoreWarning")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <input ref={fileInputRef} type="file" accept=".db" className="text-sm" />
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={doRestore} disabled={restoring}>
                      {t("common.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("common.file")}</th>
                  <th>{t("common.type")}</th>
                  <th className="num">{t("common.size")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td>{format(new Date(b.createdAt), "dd MMM yyyy, HH:mm")}</td>
                    <td className="text-xs text-muted-foreground">{b.filePath}</td>
                    <td>
                      <Badge variant="outline">{b.auto ? t("common.auto") : t("common.manual")}</Badge>
                    </td>
                    <td className="num">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td>
                      <a href={`/api/backup/${b.filePath}`} className="text-primary hover:underline">
                        <Download className="inline size-3.5" /> {t("common.download")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
