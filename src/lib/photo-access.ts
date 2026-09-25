import { authSecret } from "@/lib/session-token";

const PHOTO_TTL_MS = 60 * 60 * 24 * 14;

function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacHex(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(signature);
}

export async function signUploadPath(path: string, now = Date.now()) {
  if (!path.startsWith("/uploads/") || path.includes("..")) return path;
  const exp = String(now + PHOTO_TTL_MS);
  const sig = await hmacHex(`${path}.${exp}`);
  return `${path}?exp=${exp}&sig=${sig}`;
}

export async function signedMediaUrl(value: string, now = Date.now()) {
  if (value.startsWith("/uploads/")) return signUploadPath(value, now);
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    if (!url.pathname.startsWith("/uploads/") || url.pathname.includes("..")) return value;
    const exp = String(now + PHOTO_TTL_MS);
    const sig = await hmacHex(`${url.pathname}.${exp}`);
    url.searchParams.set("exp", exp);
    url.searchParams.set("sig", sig);
    return url.toString();
  } catch {
    return value;
  }
}

export async function uploadAccessGranted(
  pathname: string,
  exp: string | null,
  sig: string | null,
  now = Date.now(),
) {
  if (!pathname.startsWith("/uploads/")) return true;
  if (pathname.includes("..") || pathname.includes("\\") || pathname.includes("\0")) return false;
  if (!exp || !sig || !/^\d{1,16}$/.test(exp)) return false;
  if (Number(exp) < now) return false;
  const expected = await hmacHex(`${pathname}.${exp}`);
  return timingSafeEqual(expected, sig);
}

const MEDIA_KEYS = new Set(["url", "photoUrl", "path"]);

export async function signMediaFields<T>(value: T, key?: string): Promise<T> {
  if (typeof value === "string") {
    if (key && MEDIA_KEYS.has(key)) return (await signedMediaUrl(value)) as T;
    return value;
  }
  if (Array.isArray(value)) {
    const signed = await Promise.all(value.map((item) => signMediaFields(item)));
    return signed as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value)) {
      out[childKey] = await signMediaFields(child, childKey);
    }
    return out as T;
  }
  return value;
}

export async function signPhotoPaths<T extends { path: string }>(photos: T[]) {
  return Promise.all(photos.map(async (photo) => ({ ...photo, path: await signUploadPath(photo.path) })));
}
