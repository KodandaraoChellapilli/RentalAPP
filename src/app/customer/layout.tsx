import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  return <AppShell user={user}>{children}</AppShell>;
}
