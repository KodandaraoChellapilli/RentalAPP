import { PageHeader } from "@/components/PageHeader";
import { JobsTable } from "@/components/lists/JobsTable";
import { prisma } from "@/lib/prisma";

export default async function AdminPickupsPage() {
  const events = await prisma.scheduleEvent.findMany({
    where: { type: "PICKUP" },
    include: { equipment: true, customer: true, employee: true },
    orderBy: { startAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pickups"
        subtitle="Assigned and completed pickups. Completing a pickup calculates the final rental amount."
        action={{ href: "/admin/schedule/new", label: "Schedule pickup" }}
      />
      <JobsTable
        emptyTitle="No pickups yet"
        emptyBody="Schedule a pickup when a customer is ready to return a machine."
        completeHref={(job) => `/employee/pickup?eventId=${job.id}${job.rentalId ? `&rentalId=${job.rentalId}` : ""}`}
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
