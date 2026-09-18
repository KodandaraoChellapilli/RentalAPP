import { notFound } from "next/navigation";
import { CustomerConfirmDeliveryForm, CustomerEndRentalForm } from "@/components/CustomerRentalActions";
import { LiveCharge } from "@/components/LiveCharge";
import { Alert } from "@/components/ui/Alert";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { BeforeAfterPhotos } from "@/components/photos/BeforeAfterPhotos";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel } from "@/components/ui/Panel";
import { formatRate } from "@/lib/billing";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export default async function CustomerRentalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; requested?: string; confirmed?: string }>;
}) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const { id } = await params;
  const { error, requested, confirmed } = await searchParams;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: {
      equipment: true,
      customer: true,
      photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
      events: { orderBy: { startAt: "asc" } },
    },
  });

  if (!rental) notFound();
  if (user.role === "CUSTOMER" && rental.customerId !== user.customerId) notFound();

  const delivery = rental.events.find((event) => event.type === "DELIVERY");
  const pickupRequest = rental.events.find((event) => event.type === "PICKUP" && !event.completedAt);
  const canConfirmDelivery = Boolean(
    rental.status === "SCHEDULED" && delivery && !delivery.completedAt && !delivery.customerConfirmedAt,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`${rental.equipment.name} #${rental.equipment.number}`}
        subtitle={`${rental.customer.name} · ${formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}`}
      />
      <ErrorBanner message={error} />
      {requested ? (
        <Alert variant="success" className="mb-4">
          Pickup requested. Your rental stays active until the yard completes the pickup.
        </Alert>
      ) : null}
      {confirmed ? (
        <Alert variant="success" className="mb-4">
          Delivery details confirmed. The rental starts when the equipment is delivered.
        </Alert>
      ) : null}
      <div className="mb-4">
        <StatusBadge kind="rental" status={rental.status} />
      </div>
      <Panel>
        <LiveCharge
          asOf={Date.now()}
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
          {delivery ? <p>Scheduled delivery: {formatDateTime(delivery.startAt)}</p> : null}
          {delivery?.customerConfirmedAt ? <p>You confirmed this delivery on {formatDateTime(delivery.customerConfirmedAt)}.</p> : null}
          {pickupRequest ? (
            <p>
              Pickup requested for {formatDateTime(pickupRequest.startAt)}
              {pickupRequest.destination ? ` at ${pickupRequest.destination}` : ""}. The rental is still active.
            </p>
          ) : null}
        </div>
      </Panel>
      {canConfirmDelivery ? <CustomerConfirmDeliveryForm rentalId={rental.id} /> : null}
      {rental.status === "ACTIVE" ? (
        <CustomerEndRentalForm rentalId={rental.id} defaultLocation={rental.destination} />
      ) : null}
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
