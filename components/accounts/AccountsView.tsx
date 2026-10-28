"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AccountFormDialog } from "./AccountFormDialog";
import { deactivateAccountAction } from "@/app/actions/accounts";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { AccountType } from "@prisma/client";

interface AccountRow {
  id: string;
  code: string;
  name: string;
  nameUr: string | null;
  type: AccountType;
  openingBalance: number;
  phone: string | null;
  isActive: boolean;
  isSystem: boolean;
}

export function AccountsView({ accounts }: { accounts: AccountRow[] }) {
  const t = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => accounts.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.code.toLowerCase().includes(query.toLowerCase())),
    [accounts, query],
  );

  const grouped = useMemo(() => {
    const map = new Map<AccountType, AccountRow[]>();
    for (const a of filtered) {
      if (!map.has(a.type)) map.set(a.type, []);
      map.get(a.type)!.push(a);
    }
    return map;
  }, [filtered]);

  async function handleDeactivate(id: string) {
    const res = await deactivateAccountAction(id);
    if (!res.ok) toast.error(res.error ?? t("common.error"));
    else toast.success(t("common.saved"));
  }

  return (
    <div>
      <PageHeader title={t("account.title")} actions={<AccountFormDialog />} />
      <Input placeholder={t("common.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4 max-w-sm" id="account-search" data-slash-focus />
      <div className="flex flex-col gap-6">
        {[...grouped.entries()].map(([type, rows]) => (
          <div key={type}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`account.type${type.charAt(0)}${type.slice(1).toLowerCase()}`)}
            </h3>
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{t("common.code")}</th>
                  <th>{t("common.name")}</th>
                  <th>{t("common.phone")}</th>
                  <th className="num">{t("common.openingBalance")}</th>
                  <th>{t("common.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>
                      {a.name}
                      {a.nameUr && <span className="ml-2 font-urdu text-muted-foreground">{a.nameUr}</span>}
                    </td>
                    <td>{a.phone ?? "—"}</td>
                    <td className="num">
                      <Money paisa={a.openingBalance} />
                    </td>
                    <td>
                      {a.isSystem && <Badge variant="outline">{t("account.systemAccount")}</Badge>}
                      {!a.isSystem && (a.isActive ? <Badge variant="success">{t("common.active")}</Badge> : <Badge variant="destructive">{t("common.inactive")}</Badge>)}
                    </td>
                    <td>
                      {!a.isSystem && a.isActive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {t("common.deactivate")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("common.confirmDeactivateAccountTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("common.confirmDeactivateAccountDescription")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(a.id)}>{t("common.confirm")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
