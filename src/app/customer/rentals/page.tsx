import { RentalCard, RentalHistoryRow } from "@/components/cards/RentalCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function CustomerRentalsPage() {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const customerId = user.customerId;
  if (!customerId) {
    return <PageHeader title="No customer profile" subtitle="This login is not linked to a customer account." />;
  }

  const [rentals, documents] = await Promise.all([
    prisma.rental.findMany({
    where: { customerId },
    include: { equipment: true },
    orderBy: { createdAt: "desc" },
    }),
    prisma.customerDocument.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } }),
  ]);
  const active = rentals.filter((rental) => rental.status === "ACTIVE" || rental.status === "SCHEDULED");
  const history = rentals.filter((rental) => rental.status === "COMPLETED" || rental.status === "CANCELLED");

  return (
    <div>
      <PageHeader title="My equipment" subtitle="Your current and past rentals." />
      <h2 className="mb-3 font-semibold">On rent</h2>
      {active.length === 0 ? (
        <EmptyState title="Nothing out right now" body="When equipment is delivered to your jobsite, it will appear here with a live estimated charge." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((rental) => (
            <RentalCard
              key={rental.id}
              id={rental.id}
              href={`/customer/rentals/${rental.id}`}
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
        </div>
      )}
      <h2 className="mt-8 mb-3 font-semibold">Documents</h2>
      {documents.length === 0 ? (
        <EmptyState title="No documents" body="Certificates of insurance uploaded by the yard will appear here." />
      ) : (
        <div className="card divide-y divide-stone-100">
          {documents.map((document) => (
            <a key={document.id} href={`/api/documents/${document.id}`} className="block px-4 py-3 text-sm">
              <span className="font-medium">{document.name}</span>
              <span className="text-stone-500">
                {" "}
                · {DOCUMENT_TYPE_LABELS[document.type as DocumentType] || document.type} · {formatDate(document.createdAt)}
              </span>
            </a>
          ))}
        </div>
      )}
      <h2 className="mt-8 mb-3 font-semibold">Rental history</h2>
      {history.length === 0 ? (
        <EmptyState title="No completed rentals yet" body="Finished jobs and final amounts will show here after pickup." />
      ) : (
        <div className="card divide-y divide-stone-100">
          {history.map((rental) => (
            <RentalHistoryRow
              key={rental.id}
              id={rental.id}
              href={`/customer/rentals/${rental.id}`}
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
      )}
    </div>
  );
}
