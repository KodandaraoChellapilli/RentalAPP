import { PageHeader } from "@/components/PageHeader";
import { JobsTable } from "@/components/lists/JobsTable";
import { prisma } from "@/lib/prisma";
import { isTransportType } from "@/lib/transports";

export default async function AdminTransportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const transportType = type && isTransportType(type) ? type : undefined;
  const events = await prisma.scheduleEvent.findMany({
    where: { type: transportType || { in: ["DELIVERY", "PICKUP"] } },
    include: { equipment: true, customer: true, employee: true },
    orderBy: { startAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Transports"
        subtitle="Deliveries and pickups for the yard. Completing a delivery starts the rental; completing a pickup closes it."
        action={{ href: "/admin/schedule/new", label: "Schedule transport" }}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <a className={!transportType ? "btn btn-dark" : "btn btn-ghost"} href="/admin/transports">
          All
        </a>
        <a className={transportType === "DELIVERY" ? "btn btn-dark" : "btn btn-ghost"} href="/admin/transports?type=DELIVERY">
          Deliveries
        </a>
        <a className={transportType === "PICKUP" ? "btn btn-dark" : "btn btn-ghost"} href="/admin/transports?type=PICKUP">
          Pickups
        </a>
      </div>
      <JobsTable
        emptyTitle="No transports yet"
        emptyBody="Schedule a delivery when a salesman starts a rental, or a pickup when a customer is ready to return a machine."
        completeHref={(job) =>
          job.type === "PICKUP"
            ? `/employee/pickup?eventId=${job.id}${job.rentalId ? `&rentalId=${job.rentalId}` : ""}`
            : `/employee/deliver?eventId=${job.id}`
        }
        items={events.map((event) => ({
          id: event.id,
          type: event.type,
          title: event.title,
          startAt: event.startAt,
          completedAt: event.completedAt,
          destination: event.destination,
          equipmentId: event.equipmentId,
          equipmentLabel: event.equipment ? `#${event.equipment.number} ${event.equipment.name}` : null,
          customerName: event.customer?.name ?? null,
          employeeName: event.employee?.name ?? null,
          rentalId: event.rentalId,
          source: event.source === "CUSTOMER" || event.notes?.includes("Customer requested pickup") ? "CUSTOMER" : event.source,
        }))}
      />
    </div>
  );
}
