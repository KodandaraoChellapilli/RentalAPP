import { PageHeader } from "@/components/PageHeader";
import { EquipmentCatalog } from "@/components/lists/EquipmentCatalog";
import { formatRate } from "@/lib/billing";
import { signUploadPath } from "@/lib/photo-access";
import { prisma } from "@/lib/prisma";

export default async function EquipmentListPage() {
  const equipment = await prisma.equipment.findMany({
    include: {
      photos: { orderBy: { takenAt: "desc" }, take: 1 },
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
      <PageHeader title="Equipment" subtitle="Number, status, current customer, and rate." action={{ href: "/admin/equipment/new", label: "Add equipment" }} />
      <EquipmentCatalog
        items={await Promise.all(equipment.map(async (item) => ({
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
          photoPath: item.photos[0] ? await signUploadPath(item.photos[0].path) : null,
        })))}
      />
    </div>
  );
}
