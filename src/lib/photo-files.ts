const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];

export function isAllowedPhotoFile(file: { name?: string; type?: string; size?: number }) {
  if (!file || !file.size) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (name.endsWith(".svg") || type.includes("svg")) return false;
  if (type && !type.startsWith("image/")) return false;
  const ext = name.split(".").pop();
  if (ext && !ALLOWED_EXTS.includes(ext)) return false;
  return true;
}

export function sanitizePhotoExt(filename: string, mime: string) {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXTS.includes(fromName) && fromName !== "svg") {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}
