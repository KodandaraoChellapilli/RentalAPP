import { isRole, type Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId: string | null;
};

export const SESSION_COOKIE = "rental_session";
/** Signed session lifetime (cookie maxAge and bearer tokens share this). */
export const SESSION_TTL_MS = 60 * 60 * 24 * 14;

export const DEV_AUTH_SECRET = "rental-app-dev-secret-change-me";

export function authSecret(env: { NODE_ENV?: string; AUTH_SECRET?: string } = process.env) {
  const value = env.AUTH_SECRET;
  if (env.NODE_ENV === "production" && (!value || value === DEV_AUTH_SECRET)) {
    throw new Error("AUTH_SECRET must be set to a strong value in production.");
  }
  return value || DEV_AUTH_SECRET;
}

function secret() {
  return authSecret();
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(signature);
}

type SessionPayload = SessionUser & { exp?: number };

export async function encodeSession(user: SessionUser, ttlMs = SESSION_TTL_MS) {
  const body: SessionPayload = { ...user, exp: Date.now() + ttlMs };
  const payload = toBase64Url(JSON.stringify(body));
  return `${payload}.${await sign(payload)}`;
}

export async function decodeSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await sign(payload);
  if (!timingSafeEqual(expected, sig)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as SessionPayload;
    if (!parsed?.id || !isRole(parsed.role)) return null;
    if (typeof parsed.exp === "number" && parsed.exp < Date.now()) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      customerId: parsed.customerId,
    };
  } catch {
    return null;
  }
}
