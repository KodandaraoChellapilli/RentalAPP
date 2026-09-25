import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatDuration, formatMoney, rentalCharge } from "@/lib/billing";
import { EQUIPMENT_STATUS_LABELS, type EquipmentStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, startOfToday } from "@/lib/utils";
import { startOfWeek } from "date-fns";

export default async function ReportsPage() {
  const today = startOfToday(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const [equipment, rentals, timeEntries, events] = await Promise.all([
    prisma.equipment.findMany(),
    prisma.rental.findMany(),
    prisma.timeEntry.findMany({ where: { clockIn: { gte: weekStart } } }),
    prisma.scheduleEvent.findMany({
      where: { startAt: { gte: today } },
      include: { equipment: true, customer: true, employee: true },
      orderBy: { startAt: "asc" },
      take: 12,
    }),
  ]);

  const active = rentals.filter((rental) => rental.status === "ACTIVE");
  const completed = rentals.filter((rental) => rental.status === "COMPLETED");
  const estimated = active.reduce((sum, rental) => {
    return (
      sum +
      rentalCharge(rental.startAt, null, rental.rateSnapshot, rental.billingUnitSnapshot, rental.status, rental.finalAmount)
        .amount
    );
  }, 0);
  const finals = completed.reduce((sum, rental) => sum + (rental.finalAmount || 0), 0);
  const weekMs = timeEntries.reduce((sum, entry) => {
    const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
    return sum + Math.max(0, end - new Date(entry.clockIn).getTime());
  }, 0);

  const byStatus = {
    AVAILABLE: equipment.filter((item) => item.status === "AVAILABLE").length,
    SCHEDULED: equipment.filter((item) => item.status === "SCHEDULED").length,
    ON_RENT: equipment.filter((item) => item.status === "ON_RENT").length,
    PICKUP_SCHEDULED: equipment.filter((item) => item.status === "PICKUP_SCHEDULED").length,
    MAINTENANCE: equipment.filter((item) => item.status === "MAINTENANCE").length,
    OUT_OF_SERVICE: equipment.filter((item) => item.status === "OUT_OF_SERVICE").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Live rental charges, completed amounts, inventory mix, and crew hours." />
      <div className="ops-strip">
        <StatCard title="Estimated charges" value={formatMoney(estimated)} subtitle={`${active.length} active rentals`} href="/admin/rentals" primary />
        <StatCard title="Completed amounts" value={formatMoney(finals)} subtitle={`${completed.length} finished jobs`} href="/admin/rentals" />
        <StatCard title="Crew hours this week" value={formatDuration(weekMs)} subtitle="Separate from rental time" href="/admin/hours" />
        <StatCard title="Machines" value={equipment.length} subtitle={`${byStatus.ON_RENT} on rent`} href="/admin/equipment" />
      </div>

      <Panel title="Equipment by status" padded={false}>
        <div className="grid gap-px bg-stone-100 sm:grid-cols-3">
          {Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="bg-white px-5 py-4">
              <p className="text-xs font-medium text-stone-500">
                {EQUIPMENT_STATUS_LABELS[status as EquipmentStatus] || status.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Upcoming work" action={{ href: "/admin/calendar", label: "Open calendar" }} padded={false}>
        <div className="divide-y divide-stone-100">
          {events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone-500">Nothing scheduled from today forward.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {event.type} {event.equipment ? `#${event.equipment.number} ${event.equipment.name}` : event.title}
                  </p>
                  <p className="text-stone-500">
                    {event.customer?.name || "No customer"}
                    {event.employee ? ` · ${event.employee.name}` : " · Unassigned"}
                  </p>
                </div>
                <p className="text-stone-600">{formatDateTime(event.startAt)}</p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
