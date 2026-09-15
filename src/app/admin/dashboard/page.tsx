import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { getOwnerDashboard } from "@/lib/queries/dashboard";

export default async function AdminDashboardPage() {
  const data = await getOwnerDashboard();
  return <OwnerDashboard data={data} />;
}
