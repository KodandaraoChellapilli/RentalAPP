import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { createInvoiceForRental, listInvoices } from "@/lib/services/invoices";
import { invoiceJson } from "@/lib/api/invoice-json";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const customerId = request.nextUrl.searchParams.get("customerId");
    const invoices = await listInvoices(customerId);
    return json({ invoices: invoices.map(invoiceJson) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const body = await request.json();
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    const invoice = await createInvoiceForRental({
      rentalId: String(body.rentalId || ""),
      dueDate,
      notes: body.notes ? String(body.notes) : null,
    });
    return json({ invoice: invoiceJson(invoice) }, 201);
  } catch (error) {
    return fail(error);
  }
}
