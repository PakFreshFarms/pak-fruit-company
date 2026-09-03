"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { NewFarmDialog } from "./NewFarmDialog";
import { Sprout } from "lucide-react";

interface FarmRow {
  id: string;
  name: string;
  season: string;
  rentAmount: number;
  isClosed: boolean;
  totalExpenses: number;
  totalDispatchIncome: number;
  netResult: number;
}

export function FarmsListView({ farms }: { farms: FarmRow[] }) {
  const t = useTranslation();

  return (
    <div>
      <PageHeader title={t("farm.title")} actions={<NewFarmDialog />} />
      {farms.length === 0 ? (
        <EmptyState icon={Sprout} title={t("common.noResults")} instruction="Add a farm when you rent an orchard for the season." />
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("farm.season")}</th>
              <th className="num">{t("farm.rentAmount")}</th>
              <th className="num">{t("farm.expenses")}</th>
              <th className="num">{t("farm.dispatches")}</th>
              <th className="num">{t("farm.netResult")}</th>
              <th>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {farms.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link href={`/farms/${f.id}`} className="hover:underline">
                    {f.name}
                  </Link>
                </td>
                <td>{f.season}</td>
                <td className="num">
                  <Money paisa={f.rentAmount} />
                </td>
                <td className="num">
                  <Money paisa={f.totalExpenses} />
                </td>
                <td className="num">
                  <Money paisa={f.totalDispatchIncome} />
                </td>
                <td className="num font-medium">
                  <Money paisa={f.netResult} />
                </td>
                <td>
                  <Badge variant={f.isClosed ? "outline" : "success"}>{f.isClosed ? t("common.inactive") : t("common.active")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
