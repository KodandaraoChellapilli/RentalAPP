import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createCustomer } from "@/lib/actions/people";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add customer" subtitle="Optionally create a customer portal login at the same time." />
      <ErrorBanner message={error} />
      <form action={createCustomer} className="card space-y-4 p-6">
        <label className="block">
          <span className="field-label">Company name</span>
          <input className="field mt-1.5" name="name" required />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field mt-1.5" name="email" type="email" />
        </label>
        <label className="block">
          <span className="field-label">Phone</span>
          <input className="field mt-1.5" name="phone" />
        </label>
        <label className="block">
          <span className="field-label">Address</span>
          <input className="field mt-1.5" name="address" />
        </label>
        <label className="block">
          <span className="field-label">Notes</span>
          <textarea className="field mt-1.5" name="notes" rows={3} />
        </label>
        <div className="rounded-xl bg-stone-50 p-4">
          <p className="mb-3 text-sm font-semibold">Customer portal login (optional)</p>
          <label className="block">
            <span className="field-label">Contact name</span>
            <input className="field mt-1.5" name="portalName" />
          </label>
          <label className="mt-3 block">
            <span className="field-label">Login email</span>
            <input className="field mt-1.5" name="portalEmail" type="email" />
          </label>
          <label className="mt-3 block">
            <span className="field-label">Temporary password</span>
            <input className="field mt-1.5" name="portalPassword" type="password" minLength={8} />
          </label>
        </div>
        <SubmitButton pendingLabel="Saving…">Save customer</SubmitButton>
      </form>
    </div>
  );
}
