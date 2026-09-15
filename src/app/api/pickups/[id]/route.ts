import { NextRequest } from "next/server";
import { canAccessEvent, requireStaff } from "@/lib/api/access";
import { fail, json, options, publicOrigin, requireApiUser } from "@/lib/api/http";
import { eventJson, photoJson, rentalJson } from "@/lib/api/serialize";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
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
            photos: { where: { type: "DELIVERY" }, include: photoInclude, orderBy: { takenAt: "asc" } },
          },
        },
      },
    });

    if (event && event.type === "PICKUP") {
      if (!canAccessEvent(user, event.employeeId)) throw new ServiceError("You do not have access.", 403);
      const rental = event.rental;
      return json({
        job: eventJson(event),
        rental: rental
          ? rentalJson(rental, {
              beforePhotos: rental.photos.map((photo) => photoJson(photo, origin)),
            })
          : null,
      });
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true,
        customer: true,
        photos: { where: { type: "DELIVERY" }, include: photoInclude, orderBy: { takenAt: "asc" } },
      },
    });
    if (!rental || rental.status !== "ACTIVE") throw new ServiceError("Pickup not found.", 404);
    return json({
      job: null,
      rental: rentalJson(rental, {
        beforePhotos: rental.photos.map((photo) => photoJson(photo, origin)),
      }),
    });
  } catch (error) {
    return fail(error);
  }
}
