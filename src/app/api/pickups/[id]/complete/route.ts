import { NextRequest } from "next/server";
import { canAccessEvent, requireStaff } from "@/lib/api/access";
import { fail, filesFromRequest, json, options, requireApiUser } from "@/lib/api/http";
import { confirmed } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";
import { completePickupService } from "@/lib/services/rentals";

export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    const { id } = await context.params;
    const form = await request.formData();

    const event = await prisma.scheduleEvent.findUnique({ where: { id } });
    if (event) {
      if (event.type !== "PICKUP") throw new ServiceError("Pickup not found.", 404);
      if (!canAccessEvent(user, event.employeeId)) throw new ServiceError("You do not have access.", 403);
    }

    const rentalId = String(form.get("rentalId") || event?.rentalId || id);
    const result = await completePickupService({
      user,
      eventId: event?.id || null,
      rentalId,
      notes: String(form.get("notes") || ""),
      conditionConfirmed: confirmed(form.get("conditionConfirmed")),
      hasIssue: String(form.get("hasIssue") || "") === "yes" ? "yes" : "no",
      afterStatus: String(form.get("afterStatus") || ""),
      photos: filesFromRequest(form),
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return fail(error);
  }
}
