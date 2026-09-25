import { notFound } from "next/navigation";
import { RentalCard, RentalHistoryRow } from "@/components/cards/RentalCard";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createCustomerPortalUser, updateCustomer } from "@/lib/actions/people";
import { uploadCustomerDocument, removeCustomerDocument } from "@/lib/actions/documents";
import { EquipmentConditionHistory } from "@/components/photos/EquipmentConditionHistory";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney } from "@/lib/billing";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      users: true,
      documents: { orderBy: { createdAt: "desc" } },
      invoices: { include: { equipment: true }, orderBy: { createdAt: "desc" } },
      rentals: {
        include: {
          equipment: true,
          invoice: true,
          photos: { include: { uploadedBy: true }, orderBy: { takenAt: "asc" } },
          events: { include: { employee: true }, orderBy: { startAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) notFound();

  const active = customer.rentals.filter((rental) => rental.status === "ACTIVE" || rental.status === "SCHEDULED");
  const history = customer.rentals.filter((rental) => rental.status === "COMPLETED" || rental.status === "CANCELLED");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <PageHeader title={customer.name} subtitle="Contact details and portal users." />
        <ErrorBanner message={error} />
        <form action={updateCustomer} className="card space-y-4 p-6">
          <input type="hidden" name="id" value={customer.id} />
          <Field label="Company name">
            <input className="field" name="name" required defaultValue={customer.name} />
          </Field>
          <Field label="Email">
            <input className="field" name="email" type="email" defaultValue={customer.email ?? ""} />
          </Field>
          <Field label="Phone">
            <input className="field" name="phone" defaultValue={customer.phone ?? ""} />
          </Field>
          <Field label="Address">
            <input className="field" name="address" defaultValue={customer.address ?? ""} />
          </Field>
          <Field label="Notes">
            <textarea className="field" name="notes" rows={3} defaultValue={customer.notes ?? ""} />
          </Field>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </form>
        <div className="mt-4 card p-5 text-sm text-stone-600">
          <p className="font-semibold text-stone-800">Portal users</p>
          {customer.users.length === 0 ? (
            <p className="mt-1">None yet. Add a login so this customer can see their rentals.</p>
          ) : (
            customer.users.map((user) => (
              <p key={user.id} className="mt-1">
                {user.name} · {user.email}
              </p>
            ))
          )}
          {session?.role === "ADMIN" ? (
          <form action={createCustomerPortalUser} className="mt-4 space-y-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <Field label="Contact name">
              <input className="field" name="portalName" required />
            </Field>
            <Field label="Login email">
              <input className="field" name="portalEmail" type="email" required />
            </Field>
            <Field label="Temporary password">
              <input className="field" name="portalPassword" type="password" required minLength={8} />
            </Field>
            <SubmitButton variant="dark" pendingLabel="Adding…">
              Add portal login
            </SubmitButton>
            </form>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Only the owner can create customer logins.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Rentals</h2>
        {customer.rentals.length === 0 ? (
          <EmptyState title="No rentals" body="This company does not have any rental records yet." />
        ) : (
          <div className="space-y-3">
            {active.map((rental) => (
              <RentalCard
                key={rental.id}
                id={rental.id}
                href={`/admin/equipment/${rental.equipmentId}`}
                number={rental.equipment.number}
                name={rental.equipment.name}
                status={rental.status}
                startAt={rental.startAt}
                expectedPickupAt={rental.expectedPickupAt}
                rate={rental.rateSnapshot}
                unit={rental.billingUnitSnapshot}
                finalAmount={rental.finalAmount}
              />
            ))}
            {history.length ? (
              <div className="card divide-y divide-stone-100">
                {history.map((rental) => (
                  <RentalHistoryRow
                    key={rental.id}
                    id={rental.id}
                    href={`/admin/equipment/${rental.equipmentId}`}
                    number={rental.equipment.number}
                    name={rental.equipment.name}
                    status={rental.status}
                    startAt={rental.startAt}
                    endAt={rental.endAt}
                    rate={rental.rateSnapshot}
                    unit={rental.billingUnitSnapshot}
                    finalAmount={rental.finalAmount}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <section className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Invoices</h2>
        {customer.invoices.length === 0 ? (
          <EmptyState title="No invoices" body="Create an invoice from one of this customer's rentals." />
        ) : (
          <div className="card divide-y divide-stone-100">
            {customer.invoices.map((invoice) => (
              <a key={invoice.id} href={`/admin/invoices/${invoice.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{invoice.number}</span>
                  <span className="text-stone-500"> · #{invoice.equipment.number} {invoice.equipment.name}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{formatMoney(invoice.total)}</span>
                  <span className="text-stone-500">{formatDate(invoice.dueDate)}</span>
                  <StatusBadge kind="invoice" status={invoice.status} />
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Documents</h2>
        <form action={uploadCustomerDocument} className="card mb-3 flex flex-wrap items-end gap-3 p-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <Field label="Certificate of Insurance (PDF)">
            <input className="field" type="file" name="file" accept="application/pdf,.pdf" required />
          </Field>
          <Field label="Name">
            <input className="field" name="name" placeholder="Certificate of Insurance" />
          </Field>
          <SubmitButton pendingLabel="Uploading…">Upload PDF</SubmitButton>
        </form>
        {customer.documents.length === 0 ? (
          <EmptyState title="No documents" body="Upload this customer's certificate of insurance." />
        ) : (
          <div className="card divide-y divide-stone-100">
            {customer.documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <a className="font-medium" href={`/api/documents/${document.id}`}>{document.name}</a>
                  <p className="text-stone-500">
                    {DOCUMENT_TYPE_LABELS[document.type as DocumentType] || document.type} · {formatDate(document.createdAt)}
                  </p>
                </div>
                <form action={removeCustomerDocument}>
                  <input type="hidden" name="id" value={document.id} />
                  <input type="hidden" name="customerId" value={customer.id} />
                  <SubmitButton variant="dark" pendingLabel="Removing…">Delete</SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="lg:col-span-2">
        <EquipmentConditionHistory
          equipmentNumber=""
          equipmentName={customer.name}
          rentals={customer.rentals.map((rental) => ({ ...rental, customer: { name: customer.name } }))}
        />
      </section>
    </div>
  );
}
