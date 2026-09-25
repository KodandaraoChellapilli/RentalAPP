export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function isPdfBytes(bytes: Uint8Array) {
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export function safeDownloadName(name: string) {
  const cleaned = name.replace(/[\r\n"]/g, "").replace(/[^A-Za-z0-9._ -]/g, "").trim() || "document";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

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
