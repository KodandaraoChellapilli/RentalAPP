import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { confirmCustomerDeliveryService } from "@/lib/services/schedule";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireCustomer(await requireApiUser(request, ["CUSTOMER", "ADMIN"]));
    const { id } = await context.params;
    const result = await confirmCustomerDeliveryService({ user, rentalId: id });
    return json({ ok: true, ...result });
  } catch (error) {
    return fail(error);
  }
}
