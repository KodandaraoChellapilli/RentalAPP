import { AccountSettingsForm } from "@/components/AccountSettingsForm";
import { PageHeader } from "@/components/PageHeader";
import { requireUser } from "@/lib/session";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const user = await requireUser();
  const { error, updated } = await searchParams;

  return (
    <div>
      <PageHeader title="Account settings" subtitle="Manage your sign-in details for Ridgeline Rentals." />
      <AccountSettingsForm name={user.name} email={user.email} error={error} updated={updated === "1"} />
    </div>
  );
}
