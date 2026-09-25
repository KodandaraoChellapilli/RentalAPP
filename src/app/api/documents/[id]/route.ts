import { NextRequest, NextResponse } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { deleteCustomerDocument, readCustomerDocument } from "@/lib/services/documents";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireApiUser(request, ["ADMIN", "MANAGER", "CUSTOMER"]);
    if (user.role !== "CUSTOMER") requireOperations(user);
    const { id } = await params;
    const { document, bytes } = await readCustomerDocument(id, user);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.name.replaceAll('"', "")}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const { id } = await params;
    await deleteCustomerDocument(id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
