import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { rentalJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const rentals = await prisma.rental.findMany({
      include: { equipment: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return json({ rentals: rentals.map((rental) => rentalJson(rental)) });
  } catch (error) {
    return fail(error);
  }
}
