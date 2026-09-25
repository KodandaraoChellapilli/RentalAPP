import { NextRequest } from "next/server";
import { canAccessEvent } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { eventJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(request, ["EMPLOYEE", "ADMIN", "MANAGER"]);
    const { id } = await context.params;
    const event = await prisma.scheduleEvent.findUnique({
      where: { id },
      include: { equipment: true, customer: true, rental: true, employee: true },
    });
    if (!event || event.type !== "DELIVERY") throw new ServiceError("Delivery not found.", 404);
    if (!canAccessEvent(user, event.employeeId)) throw new ServiceError("You do not have access.", 403);
    return json({ job: eventJson(event) });
  } catch (error) {
    return fail(error);
  }
}
