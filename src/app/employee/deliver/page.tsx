import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { DeliveryForm } from "@/components/photos/DeliveryForm";
import { JobSummary } from "@/components/yard/JobSummary";
import { WorkflowSteps } from "@/components/yard/WorkflowSteps";
import { formatRate } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export default async function DeliverPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; error?: string }>;
}) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const { eventId, error } = await searchParams;
  const [event, assigned, equipment, customers] = await Promise.all([
    eventId
      ? prisma.scheduleEvent.findUnique({
          where: { id: eventId },
          include: { equipment: true, customer: true, rental: true },
        })
      : Promise.resolve(null),
    prisma.scheduleEvent.findMany({
      where: {
        type: "DELIVERY",
        completedAt: null,
        ...(user.role === "EMPLOYEE" ? { employeeId: user.id } : {}),
      },
      include: { equipment: true },
    }),
    prisma.equipment.findMany({
      where: { status: { in: ["AVAILABLE", "SCHEDULED"] } },
      orderBy: { number: "asc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const assignedIds = new Set(assigned.map((item) => item.equipmentId).filter(Boolean));
  const visibleEquipment =
    user.role === "ADMIN" || user.role === "MANAGER"
      ? equipment
      : equipment.filter((item) => assignedIds.has(item.id) || item.id === event?.equipmentId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Delivery inspection"
        subtitle="Photograph the equipment before it leaves."
      />
      <ErrorBanner message={error} />
      <WorkflowSteps
        current={event ? 2 : 1}
        steps={["Job", "Inspect", "Photos", "Complete"]}
      />
      {event ? (
        <JobSummary
          title="Assigned delivery"
          number={event.equipment?.number}
          name={event.equipment?.name || event.title}
          customer={event.customer?.name}
          location={event.destination || event.rental?.destination}
          extra={
            <>
              <p>Scheduled: {formatDateTime(event.startAt)}</p>
              {event.rental ? (
                <p>
                  Rate: {formatRate(event.rental.rateSnapshot, event.rental.billingUnitSnapshot)}
                  {event.rental.expectedPickupAt ? ` · Expected pickup ${formatDateTime(event.rental.expectedPickupAt)}` : ""}
                </p>
              ) : null}
            </>
          }
        />
      ) : (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Open an assigned delivery from Jobs when possible. Before-delivery photos are still required if you start from this page.
        </p>
      )}
      <DeliveryForm
        eventId={event?.id}
        rentalId={event?.rentalId}
        equipmentId={event?.equipmentId}
        customerId={event?.customerId}
        destination={event?.destination || event?.rental?.destination}
        equipment={visibleEquipment}
        extraEquipment={event?.equipment}
        customers={customers}
      />
    </div>
  );
}
