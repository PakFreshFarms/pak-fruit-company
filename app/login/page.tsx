import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginView } from "@/components/auth/LoginView";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return <LoginView users={users} />;
}
