import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/api/access";
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
    const user = requireCustomer(await requireApiUser(request, ["CUSTOMER", "ADMIN"]));
    const { id } = await context.params;
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true,
        customer: true,
        photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
        events: { include: { equipment: true, customer: true, employee: true }, orderBy: { startAt: "asc" } },
      },
    });
    if (!rental) throw new ServiceError("Rental not found.", 404);
    if (user.role === "CUSTOMER" && rental.customerId !== user.customerId) {
      throw new ServiceError("Rental not found.", 404);
    }
    const origin = publicOrigin(request);
    const delivery = rental.events.find((event) => event.type === "DELIVERY");
    const pickupRequest = rental.events.find((event) => event.type === "PICKUP" && !event.completedAt);
    return json({
      rental: rentalJson(rental, {
        photos: rental.photos.map((photo) => photoJson(photo, origin)),
        delivery: delivery ? eventJson(delivery) : null,
        pickupRequest: pickupRequest ? eventJson(pickupRequest) : null,
        canConfirmDelivery: Boolean(
          rental.status === "SCHEDULED" && delivery && !delivery.completedAt && !delivery.customerConfirmedAt,
        ),
        canRequestPickup: rental.status === "ACTIVE",
      }),
    });
  } catch (error) {
    return fail(error);
  }
}
