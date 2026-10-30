import { getSetting } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { HomeView } from "@/components/home/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [shopName, user] = await Promise.all([getSetting("shopName", "Pak Fruit Company"), getCurrentUser()]);
  return <HomeView shopName={shopName} userName={user?.name ?? ""} />;
}
