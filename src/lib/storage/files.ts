import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

function storageRoot() {
  return path.resolve(process.env.FILE_STORAGE_DIR || path.join(process.cwd(), "storage", "private"));
}

export function resolveStoredFile(storageKey: string) {
  const root = storageRoot();
  const full = path.resolve(root, storageKey);
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
