import { NextRequest } from "next/server";
import { json, options, publicOrigin } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/api/serialize";
import { formatRate } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

/** Public catalog for a future marketing site. No customer, invoice, document, or private history data. */
export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);
  const equipment = await prisma.equipment.findMany({
    orderBy: { number: "asc" },
    include: {
      photos: {
        where: { rentalId: null },
        orderBy: { takenAt: "desc" },
        take: 1,
      },
    },
  });
  return json({
    equipment: equipment.map((item) => ({
      id: item.id,
      number: item.number,
      name: item.name,
      type: item.type,
      status: item.status,
      available: item.status === "AVAILABLE",
      rate: item.rate,
      billingUnit: item.billingUnit,
      rateLabel: formatRate(item.rate, item.billingUnit),
      photoUrl: item.photos[0] ? absoluteUrl(origin, item.photos[0].path) : null,
    })),
  });
}
