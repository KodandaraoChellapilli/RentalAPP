import { NextRequest } from "next/server";
import { json, options, publicOrigin } from "@/lib/api/http";
import { equipmentSummary } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

/** Public catalog for a future marketing site. No customer, rental, or invoice data. */
export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);
  const equipment = await prisma.equipment.findMany({
    orderBy: { number: "asc" },
    include: { photos: { orderBy: { takenAt: "desc" }, take: 1 } },
  });
  return json({
    equipment: equipment.map((item) => ({
      ...equipmentSummary(item, origin),
      description: item.notes || null,
      available: item.status === "AVAILABLE",
    })),
  });
}
