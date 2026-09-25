import { randomUUID } from "crypto";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/constants";
import { documentStorageKey, validatePdfFile } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, readStoredFile, saveStoredFile } from "@/lib/storage/files";
import { ServiceError } from "@/lib/services/errors";
import type { SessionUser } from "@/lib/session-token";

export function assertCanAccessCustomer(user: SessionUser, customerId: string) {
  if (user.role === "ADMIN" || user.role === "MANAGER") return;
  if (user.role === "CUSTOMER" && user.customerId === customerId) return;
  throw new ServiceError("You do not have access.", 403);
}

export async function saveCustomerPdf(opts: {
  customerId: string;
  file: File;
  name?: string | null;
  type?: string | null;
  uploadedById: string;
}) {
  const customer = await prisma.customer.findUnique({ where: { id: opts.customerId } });
  if (!customer) throw new ServiceError("Customer not found.", 404);

  const type = (opts.type || "CERTIFICATE_OF_INSURANCE").trim().toUpperCase();
  if (!DOCUMENT_TYPES.includes(type as DocumentType)) {
    throw new ServiceError("That document type is not supported yet.", 400);
  }
  const invalid = validatePdfFile(opts.file);
  if (invalid) throw new ServiceError(invalid, 400);

  const id = randomUUID();
  const storageKey = documentStorageKey(opts.customerId, id);
  const bytes = Buffer.from(await opts.file.arrayBuffer());
  await saveStoredFile(storageKey, bytes);

  return prisma.customerDocument.create({
    data: {
      id,
      customerId: opts.customerId,
      type,
      name: (opts.name || opts.file.name || "Certificate of Insurance").trim(),
      storageKey,
      mimeType: "application/pdf",
      sizeBytes: bytes.length,
      uploadedById: opts.uploadedById,
    },
  });
}

export async function readCustomerDocument(id: string, user: SessionUser) {
  const document = await prisma.customerDocument.findUnique({ where: { id } });
  if (!document) throw new ServiceError("Document not found.", 404);
  assertCanAccessCustomer(user, document.customerId);
  const bytes = await readStoredFile(document.storageKey);
  return { document, bytes };
}

export async function deleteCustomerDocument(id: string) {
  const document = await prisma.customerDocument.findUnique({ where: { id } });
  if (!document) throw new ServiceError("Document not found.", 404);
  await deleteStoredFile(document.storageKey);
  await prisma.customerDocument.delete({ where: { id } });
}
