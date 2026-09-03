import { AppShell } from "@/components/layout/AppShell";
import { ensureDailyBackup } from "@/lib/services/backup";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  await ensureDailyBackup();
  return <AppShell>{children}</AppShell>;
}
