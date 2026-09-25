import { NextRequest } from "next/server";
import { requireStaff } from "@/lib/api/access";
import { fail, json, options, publicOrigin, requireApiUser } from "@/lib/api/http";
import { equipmentSummary, eventJson, photoJson, rentalHistoryJson, rentalJson } from "@/lib/api/serialize";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(request, ["EMPLOYEE", "ADMIN", "MANAGER"]);
    if (user.role === "EMPLOYEE") requireStaff(user);
    const { id } = await context.params;
    const origin = publicOrigin(request);

    if (user.role === "EMPLOYEE") {
      const assigned = await prisma.scheduleEvent.findFirst({
        where: { employeeId: user.id, equipmentId: id },
      });
      if (!assigned) throw new ServiceError("Equipment not found.", 404);
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        rentals: {
          include: {
            customer: true,
            photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
            events: { include: { employee: true }, orderBy: { startAt: "asc" } },
            invoice: true,
          },
          orderBy: { createdAt: "desc" },
        },
        photos: { include: photoInclude, orderBy: { takenAt: "desc" } },
        events: {
          include: { customer: true, employee: true, equipment: true, rental: true },
          orderBy: { startAt: "desc" },
        },
      },
    });
    if (!equipment) throw new ServiceError("Equipment not found.", 404);

    const current = equipment.rentals.find((rental) => rental.status === "ACTIVE" || rental.status === "SCHEDULED");
    return json({
      equipment: equipmentSummary(equipment, origin),
      currentRental: current ? rentalJson(current) : null,
      history: equipment.rentals.map((rental) => rentalHistoryJson(rental, origin)),
      photos: equipment.photos.map((photo) => photoJson(photo, origin)),
      events: equipment.events.map(eventJson),
    });
  } catch (error) {
    return fail(error);
  }
}
