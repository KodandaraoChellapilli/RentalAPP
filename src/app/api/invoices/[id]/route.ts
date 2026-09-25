import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { invoiceJson } from "@/lib/api/invoice-json";
import { getInvoice, setInvoiceStatus } from "@/lib/services/invoices";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const { id } = await params;
    return json({ invoice: invoiceJson(await getInvoice(id)) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const { id } = await params;
    const body = await request.json();
    const invoice = await setInvoiceStatus(id, String(body.status || ""));
    return json({ invoice: invoiceJson(invoice) });
  } catch (error) {
    return fail(error);
  }
}
