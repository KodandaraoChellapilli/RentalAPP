import { EquipmentCard } from "@/components/cards/EquipmentCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRate } from "@/lib/billing";
import { employeeJobHref } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function EmployeeEquipmentPage() {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const jobs = await prisma.scheduleEvent.findMany({
    where: {
      employeeId: user.id,
      equipmentId: { not: null },
    },
    include: { equipment: { include: { photos: { orderBy: { takenAt: "desc" }, take: 1 } } }, customer: true, rental: true },
    orderBy: { startAt: "desc" },
    take: 40,
  });

  const byEquipment = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (job.equipmentId && !byEquipment.has(job.equipmentId)) {
      byEquipment.set(job.equipmentId, job);
    }
  }
  const items = [...byEquipment.values()];

  return (
    <div>
      <PageHeader title="Equipment" subtitle="Machines on your assigned deliveries and pickups." />
      {items.length === 0 ? (
        <EmptyState title="No assigned equipment" body="When the owner assigns you a delivery or pickup, the machine will show here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((job) =>
            job.equipment ? (
              <EquipmentCard
                key={job.equipmentId}
                href={employeeJobHref(job.type, job.id, job.rentalId)}
                number={job.equipment.number}
                name={job.equipment.name}
                type={job.equipment.type}
                status={job.equipment.status}
                rateLabel={formatRate(job.equipment.rate, job.equipment.billingUnit)}
                customerName={job.customer?.name}
                photoPath={job.equipment.photos[0]?.path}
                actionLabel={job.type === "PICKUP" ? "Open pickup" : "Open delivery"}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
