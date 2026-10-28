import { AppShell } from "@/components/layout/AppShell";
import { ensureDailyBackup } from "@/lib/services/backup";
import { requireUser } from "@/lib/auth/session";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await ensureDailyBackup();
  return <AppShell user={user}>{children}</AppShell>;
}
