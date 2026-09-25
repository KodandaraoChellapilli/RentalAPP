export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function validatePdfFile(file: { name?: string; type?: string; size?: number }) {
  if (!file || !file.size) return "Choose a PDF file.";
  if (file.size > MAX_DOCUMENT_BYTES) return "PDF must be 10 MB or smaller.";
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (!name.endsWith(".pdf")) return "Only PDF files can be uploaded.";
  if (type && type !== "application/pdf" && type !== "application/x-pdf") {
    return "Only PDF files can be uploaded.";
  }
  return null;
}

export function documentStorageKey(customerId: string, documentId: string) {
  return pathJoin("customers", customerId, `${documentId}.pdf`);
}

function pathJoin(...parts: string[]) {
  return parts.join("/");
}
