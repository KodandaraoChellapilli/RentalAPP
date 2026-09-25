import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Role } from "@/lib/constants";
import { hydrateSessionUser } from "@/lib/hydrate-session";
import { isAllowedPhotoFile } from "@/lib/photo-files";
import { signMediaFields } from "@/lib/photo-access";
import { SESSION_COOKIE, decodeSession, type SessionUser } from "@/lib/session-token";
import { ServiceError } from "@/lib/services/errors";

export async function json(data: unknown, status = 200) {
  return NextResponse.json(await signMediaFields(data), { status });
}

export function options() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  if (error instanceof ServiceError) {
    return json({ error: error.message }, error.status);
  }
  console.error(error);
  return json({ error: "Something went wrong." }, 500);
}

export function publicOrigin(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded || request.headers.get("host") || "localhost:3001").split(",")[0]?.trim() || "localhost:3001";
  const forwardedProto = (request.headers.get("x-forwarded-proto") || "").split(",")[0]?.trim();
  // Yard photos are served from this Next process over HTTP in local/LAN use.
  // Only honor https when a proxy explicitly forwards it.
  const proto = forwardedProto === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

export async function getApiUser(request: NextRequest): Promise<SessionUser | null> {
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (bearer) return hydrateSessionUser(await decodeSession(bearer));
  const jar = await cookies();
  return hydrateSessionUser(await decodeSession(jar.get(SESSION_COOKIE)?.value));
}

export async function requireApiUser(request: NextRequest, roles?: Role[]) {
  const user = await getApiUser(request);
  if (!user) throw new ServiceError("Please sign in.", 401);
  if (roles && !roles.includes(user.role)) throw new ServiceError("You do not have access.", 403);
  return user;
}

export function filesFromRequest(formData: FormData, key = "photos") {
  return formData
    .getAll(key)
    .filter((item): item is File => item instanceof File && isAllowedPhotoFile(item));
}
