import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/api/access";
import { fail, json, options, publicOrigin, requireApiUser } from "@/lib/api/http";
import { photoJson, rentalJson } from "@/lib/api/serialize";
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
      },
    });
    if (!rental) throw new ServiceError("Rental not found.", 404);
    if (user.role === "CUSTOMER" && rental.customerId !== user.customerId) {
      throw new ServiceError("Rental not found.", 404);
    }
    const origin = publicOrigin(request);
    return json({
      rental: rentalJson(rental, {
        photos: rental.photos.map((photo) => photoJson(photo, origin)),
      }),
    });
  } catch (error) {
    return fail(error);
  }
}
