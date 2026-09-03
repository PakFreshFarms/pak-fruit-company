import { prisma } from "@/lib/db/prisma";
import { getSetting, getCommissionRatePercent } from "@/lib/settings";
import { listBackups } from "@/lib/services/backup";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [shopName, shopAddress, financialYear, commissionRate, users, backups] = await Promise.all([
    getSetting("shopName", "Pak Fruit Company"),
    getSetting("shopAddress", ""),
    getSetting("financialYear", ""),
    getCommissionRatePercent(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    listBackups(),
  ]);

  return (
    <SettingsView
      shopName={shopName}
      shopAddress={shopAddress}
      financialYear={financialYear}
      commissionRate={commissionRate}
      users={users.map((u) => ({ id: u.id, name: u.name, role: u.role, isActive: u.isActive }))}
      backups={backups.map((b) => ({ id: b.id, filePath: b.filePath, createdAt: b.createdAt.toISOString(), sizeBytes: b.sizeBytes, auto: b.auto }))}
    />
  );
}
