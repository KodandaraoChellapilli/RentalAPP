import { PageHeader } from "@/components/PageHeader";
import { JobsTable } from "@/components/lists/JobsTable";
import { prisma } from "@/lib/prisma";

export default async function AdminDeliveriesPage() {
  const events = await prisma.scheduleEvent.findMany({
    where: { type: "DELIVERY" },
    include: { equipment: true, customer: true, employee: true },
    orderBy: { startAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Assigned and completed equipment deliveries. Completing a delivery starts the rental timer."
        action={{ href: "/admin/schedule/new", label: "Schedule delivery" }}
      />
      <JobsTable
        emptyTitle="No deliveries yet"
        emptyBody="Schedule a delivery to put a machine on a customer jobsite."
        completeHref={(job) => `/employee/deliver?eventId=${job.id}`}
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
          employeeId: event.employeeId,
          rentalId: event.rentalId,
          source: event.source === "CUSTOMER" || event.notes?.includes("Customer requested pickup") ? "CUSTOMER" : event.source,
        }))}
      />
    </div>
  );
}
