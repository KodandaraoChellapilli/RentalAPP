import { NextRequest } from "next/server";
import { canAccessEvent, requireStaff } from "@/lib/api/access";
import { fail, json, options, publicOrigin, requireApiUser } from "@/lib/api/http";
import { eventJson, photoJson, rentalJson } from "@/lib/api/serialize";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";
import { isTransportType } from "@/lib/transports";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(request, ["EMPLOYEE", "ADMIN", "MANAGER"]);
    if (user.role === "EMPLOYEE") requireStaff(user);
    const { id } = await context.params;
    const origin = publicOrigin(request);
    const event = await prisma.scheduleEvent.findUnique({
      where: { id },
      include: {
        equipment: true,
        customer: true,
        employee: true,
        rental: {
          include: {
            equipment: true,
            customer: true,
            photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
          },
        },
      },
    });
    if (!event || !isTransportType(event.type)) throw new ServiceError("Transport not found.", 404);
    if (!canAccessEvent(user, event.employeeId)) throw new ServiceError("You do not have access.", 403);

    const rental = event.rental;
    return json({
      transport: eventJson(event),
      rental: rental
        ? rentalJson(rental, {
            photos: rental.photos.map((photo) => photoJson(photo, origin)),
            beforePhotos: rental.photos.filter((photo) => photo.type === "DELIVERY").map((photo) => photoJson(photo, origin)),
            afterPhotos: rental.photos.filter((photo) => photo.type === "PICKUP").map((photo) => photoJson(photo, origin)),
          })
        : null,
    });
  } catch (error) {
    return fail(error);
  }
}
