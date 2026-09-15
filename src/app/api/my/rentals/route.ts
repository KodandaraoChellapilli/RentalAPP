import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { rentalJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = requireCustomer(await requireApiUser(request, ["CUSTOMER", "ADMIN"]));
    const customerId = user.role === "CUSTOMER" ? user.customerId : request.nextUrl.searchParams.get("customerId");
    if (!customerId) throw new ServiceError("This login is not linked to a customer account.", 403);

    const rentals = await prisma.rental.findMany({
      where: { customerId },
      include: { equipment: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return json({
      active: rentals.filter((rental) => rental.status === "ACTIVE" || rental.status === "SCHEDULED").map((rental) => rentalJson(rental)),
      history: rentals.filter((rental) => rental.status === "COMPLETED" || rental.status === "CANCELLED").map((rental) => rentalJson(rental)),
    });
  } catch (error) {
    return fail(error);
  }
}
