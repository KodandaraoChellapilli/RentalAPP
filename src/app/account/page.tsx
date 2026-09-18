import { AccountSettingsForm } from "@/components/AccountSettingsForm";
import { PageHeader } from "@/components/PageHeader";
import { roleLabelFor } from "@/lib/nav";
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
      <PageHeader title="Account settings" subtitle="Manage your sign-in details for West Ridge Rentals." />
      <AccountSettingsForm
        name={user.name}
        email={user.email}
        roleLabel={roleLabelFor(user.role)}
        error={error}
        updated={updated === "1"}
      />
    </div>
  );
}
