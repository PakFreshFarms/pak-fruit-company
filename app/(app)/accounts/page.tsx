import { prisma } from "@/lib/db/prisma";
import { AccountsView } from "@/components/accounts/AccountsView";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  return (
    <AccountsView
      accounts={accounts.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        nameUr: a.nameUr,
        type: a.type,
        openingBalance: a.openingBalance,
        phone: a.phone,
        isActive: a.isActive,
        isSystem: a.isSystem,
      }))}
    />
  );
}
