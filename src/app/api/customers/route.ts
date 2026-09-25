import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { rentals: true, users: true } } },
      orderBy: { name: "asc" },
    });
    return json({
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        rentalCount: customer._count.rentals,
        userCount: customer._count.users,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
