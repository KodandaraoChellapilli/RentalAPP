import { NextRequest } from "next/server";
import { canAccessEvent, requireStaff } from "@/lib/api/access";
import { fail, filesFromRequest, json, options, requireApiUser } from "@/lib/api/http";
import { confirmed } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";
import { completeDeliveryService } from "@/lib/services/rentals";

export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    const { id } = await context.params;
    const event = await prisma.scheduleEvent.findUnique({ where: { id } });
    if (!event || event.type !== "DELIVERY") throw new ServiceError("Delivery not found.", 404);
    if (!canAccessEvent(user, event.employeeId)) throw new ServiceError("You do not have access.", 403);

    const form = await request.formData();
    const result = await completeDeliveryService({
      user,
      eventId: id,
      rentalId: String(form.get("rentalId") || event.rentalId || "") || null,
      equipmentId: String(form.get("equipmentId") || event.equipmentId || ""),
      customerId: String(form.get("customerId") || event.customerId || ""),
      destination: String(form.get("destination") || event.destination || ""),
      notes: String(form.get("notes") || ""),
      conditionConfirmed: confirmed(form.get("conditionConfirmed")),
      photos: filesFromRequest(form),
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return fail(error);
  }
}
