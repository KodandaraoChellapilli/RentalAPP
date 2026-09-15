import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Role } from "@/lib/constants";
import { SESSION_COOKIE, decodeSession, type SessionUser } from "@/lib/session-token";
import { ServiceError } from "@/lib/services/errors";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function options() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
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
  const host = forwarded || request.headers.get("host") || "localhost:3001";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getApiUser(request: NextRequest): Promise<SessionUser | null> {
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (bearer) return decodeSession(bearer);
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireApiUser(request: NextRequest, roles?: Role[]) {
  const user = await getApiUser(request);
  if (!user) throw new ServiceError("Please sign in.", 401);
  if (roles && !roles.includes(user.role)) throw new ServiceError("You do not have access.", 403);
  return user;
}

export function filesFromRequest(formData: FormData, key = "photos") {
  return formData.getAll(key).filter((item): item is File => item instanceof File && item.size > 0);
}
