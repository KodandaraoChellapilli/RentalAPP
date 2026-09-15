import { PageHeader } from "@/components/PageHeader";
import { EquipmentCatalog } from "@/components/lists/EquipmentCatalog";
import { formatRate } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export default async function EquipmentListPage() {
  const equipment = await prisma.equipment.findMany({
    include: {
      rentals: {
        where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
        include: { customer: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { number: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Every machine has a number, rate, status, and full history."
        action={{ href: "/admin/equipment/new", label: "Add equipment" }}
      />
      <EquipmentCatalog
        items={equipment.map((item) => ({
          id: item.id,
          number: item.number,
          name: item.name,
          type: item.type,
          status: item.status,
          rate: item.rate,
          rateLabel: formatRate(item.rate, item.billingUnit),
          billingUnit: item.billingUnit,
          currentCustomer: item.rentals[0]?.customer.name ?? null,
          currentRentalStatus: item.rentals[0]?.status ?? null,
        }))}
      />
    </div>
  );
}
