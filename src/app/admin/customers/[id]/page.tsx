import { notFound } from "next/navigation";
import { RentalCard, RentalHistoryRow } from "@/components/cards/RentalCard";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createCustomerPortalUser, updateCustomer } from "@/lib/actions/people";
import { prisma } from "@/lib/prisma";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      users: true,
      rentals: { include: { equipment: true }, orderBy: { createdAt: "desc" } },
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
    </div>
  );
}
