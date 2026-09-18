import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { requestCustomerPickupService } from "@/lib/services/schedule";

export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireCustomer(await requireApiUser(request, ["CUSTOMER", "ADMIN"]));
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await requestCustomerPickupService({
      user,
      rentalId: id,
      pickupDate: String(body.pickupDate || body.date || ""),
      pickupTime: String(body.pickupTime || body.time || ""),
      pickupLocation: String(body.pickupLocation || body.location || ""),
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return fail(error);
  }
}
