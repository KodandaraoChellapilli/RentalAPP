import { notFound } from "next/navigation";
import { LiveCharge } from "@/components/LiveCharge";
import { PageHeader } from "@/components/PageHeader";
import { BeforeAfterPhotos } from "@/components/photos/BeforeAfterPhotos";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel } from "@/components/ui/Panel";
import { formatRate } from "@/lib/billing";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export default async function CustomerRentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const { id } = await params;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: {
      equipment: true,
      customer: true,
      photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
    },
  });

  if (!rental) notFound();
  if (user.role === "CUSTOMER" && rental.customerId !== user.customerId) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`${rental.equipment.name} #${rental.equipment.number}`}
        subtitle={`${rental.customer.name} · ${formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}`}
      />
      <div className="mb-4">
        <StatusBadge kind="rental" status={rental.status} />
      </div>
      <Panel>
        <LiveCharge
          startAt={rental.startAt}
          endAt={rental.endAt}
          rate={rental.rateSnapshot}
          unit={rental.billingUnitSnapshot}
          status={rental.status}
          finalAmount={rental.finalAmount}
        />
        <div className="mt-6 grid gap-2 text-sm text-stone-600">
          <p>Rental started: {formatDateTime(rental.startAt)}</p>
          <p>Scheduled pickup: {formatDateTime(rental.expectedPickupAt)}</p>
          <p>Returned: {formatDateTime(rental.endAt)}</p>
          <p>Destination: {rental.destination || "—"}</p>
        </div>
      </Panel>
      <div className="mt-6">
        <BeforeAfterPhotos
          photos={rental.photos}
          beforeEmpty="Photos will appear after delivery."
          afterEmpty="Photos will appear after pickup."
        />
      </div>
    </div>
  );
}
