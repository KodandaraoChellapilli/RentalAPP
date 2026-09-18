import { PageHeader } from "@/components/PageHeader";
import { RentalsTable } from "@/components/lists/RentalsTable";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function RentalsPage() {
  const rentals = await prisma.rental.findMany({
    include: { equipment: true, customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Rentals" subtitle="Active, scheduled, and completed rental records." />
      <RentalsTable
        asOf={Date.now()}
        items={rentals.map((rental) => ({
          id: rental.id,
          equipmentId: rental.equipmentId,
          equipmentLabel: `#${rental.equipment.number} ${rental.equipment.name}`,
          customerName: rental.customer.name,
          startAt: rental.startAt?.toISOString() ?? null,
          endAt: rental.endAt?.toISOString() ?? null,
          expectedPickupAt: rental.expectedPickupAt?.toISOString() ?? null,
          status: rental.status,
          rate: rental.rateSnapshot,
          unit: rental.billingUnitSnapshot,
          finalAmount: rental.finalAmount,
          startLabel: formatDateTime(rental.startAt),
          expectedLabel: formatDateTime(rental.expectedPickupAt),
          pickupLabel: formatDateTime(rental.endAt),
        }))}
      />
    </div>
  );
}
