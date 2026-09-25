import { notFound } from "next/navigation";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createInvoice } from "@/lib/actions/invoices";
import { formatMoney } from "@/lib/billing";
import { buildInvoiceDraft, defaultDueDate } from "@/lib/invoices";
import { prisma } from "@/lib/prisma";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ rentalId?: string; error?: string }>;
}) {
  const { rentalId, error } = await searchParams;
  if (!rentalId) notFound();
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { customer: true, equipment: true, invoice: true },
  });
  if (!rental) notFound();
  const draft = buildInvoiceDraft(rental);
  const due = defaultDueDate(rental).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Create invoice"
        subtitle={`${rental.customer.name} · #${rental.equipment.number} ${rental.equipment.name}`}
      />
      <ErrorBanner message={error} />
      {rental.invoice ? (
        <p className="text-sm text-stone-600">
          This rental already has invoice {rental.invoice.number}. Open it from the invoice list.
        </p>
      ) : (
        <form action={createInvoice} className="card space-y-4 p-5">
          <input type="hidden" name="rentalId" value={rental.id} />
          <p className="text-sm text-stone-600">
            Total from the rental record: <span className="font-semibold text-stone-900">{formatMoney(draft.total)}</span>
            {draft.isEstimate ? " (estimate until the rental is completed)" : " (stored final charge)"}
          </p>
          <Field label="Due date">
            <input className="field" type="date" name="dueDate" defaultValue={due} required />
          </Field>
          <Field label="Notes">
            <textarea className="field" name="notes" rows={3} />
          </Field>
          <SubmitButton pendingLabel="Creating…">Create invoice</SubmitButton>
        </form>
      )}
    </div>
  );
}
