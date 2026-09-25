import { NextRequest } from "next/server";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { invoiceJson } from "@/lib/api/invoice-json";
import { requireCustomer } from "@/lib/api/access";
import { listInvoices } from "@/lib/services/invoices";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = requireCustomer(await requireApiUser(request, ["CUSTOMER", "ADMIN"]));
    const customerId = user.role === "CUSTOMER" ? user.customerId : request.nextUrl.searchParams.get("customerId");
    if (!customerId) return json({ invoices: [] });
    const invoices = await listInvoices(customerId);
    return json({ invoices: invoices.map(invoiceJson) });
  } catch (error) {
    return fail(error);
  }
}
