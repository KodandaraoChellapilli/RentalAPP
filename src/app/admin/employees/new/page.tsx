import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createEmployee } from "@/lib/actions/people";

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add employee" subtitle="They can sign in to clock hours and complete field jobs." />
      <ErrorBanner message={error} />
      <form action={createEmployee} className="card space-y-4 p-6">
        <label className="block">
          <span className="field-label">Name</span>
          <input className="field mt-1.5" name="name" required />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field mt-1.5" name="email" type="email" required />
        </label>
        <label className="block">
          <span className="field-label">Phone</span>
          <input className="field mt-1.5" name="phone" />
        </label>
        <label className="block">
          <span className="field-label">Temporary password</span>
          <input className="field mt-1.5" name="password" type="password" required minLength={8} />
          <p className="mt-1 text-xs text-stone-500">Must be at least 8 characters.</p>
        </label>
        <SubmitButton pendingLabel="Saving…">Save employee</SubmitButton>
      </form>
    </div>
  );
}
