import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["EMPLOYEE", "ADMIN", "MANAGER"]);
  return <AppShell user={user}>{children}</AppShell>;
}
