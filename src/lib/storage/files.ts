import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

function storageRoot() {
  return path.resolve(process.env.FILE_STORAGE_DIR || path.join(process.cwd(), "storage", "private"));
}

function normalizedKey(storageKey: string) {
  let value = storageKey;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      throw new Error("Invalid storage path.");
    }
  }
  return value.replaceAll("\\", "/");
}

export function resolveStoredFile(storageKey: string) {
  const key = normalizedKey(storageKey);
  if (!key || key.includes("\0") || path.posix.isAbsolute(key) || path.win32.isAbsolute(key)) {
    throw new Error("Invalid storage path.");
  }
  if (key.split("/").includes("..")) throw new Error("Invalid storage path.");
  const root = storageRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage path.");
  }
  return full;
}

export async function saveStoredFile(storageKey: string, bytes: Buffer) {
  const full = resolveStoredFile(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return storageKey;
}

export async function readStoredFile(storageKey: string) {
  return readFile(resolveStoredFile(storageKey));
}

export async function deleteStoredFile(storageKey: string) {
  await unlink(resolveStoredFile(storageKey)).catch(() => undefined);
}
