import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import { saveCustomerPdf } from "@/lib/services/documents";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const { id } = await params;
    const documents = await prisma.customerDocument.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });
    return json({
      documents: documents.map((document) => ({
        id: document.id,
        name: document.name,
        type: document.type,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Choose a PDF file." }, 400);
    const document = await saveCustomerPdf({
      customerId: id,
      file,
      name: String(form.get("name") || ""),
      type: String(form.get("type") || "CERTIFICATE_OF_INSURANCE"),
      uploadedById: user.id,
    });
    return json({ document: { id: document.id, name: document.name, type: document.type } }, 201);
  } catch (error) {
    return fail(error);
  }
}
