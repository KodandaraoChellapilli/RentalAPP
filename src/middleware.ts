import { NextRequest, NextResponse } from "next/server";
import { corsHeaderRecord } from "@/lib/cors";
import { uploadAccessGranted } from "@/lib/photo-access";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-token";
import { homeFor } from "@/lib/constants";

const PUBLIC = ["/login"];
const PROTECTED_PREFIXES = ["/admin", "/employee", "/customer", "/account"];

function withCors(request: NextRequest, response: NextResponse) {
  const headers = corsHeaderRecord(request.headers.get("origin"));
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  if (request.nextUrl.pathname.startsWith("/uploads")) {
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    response.headers.set("Cache-Control", "private, max-age=3600");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") return withCors(request, new NextResponse(null, { status: 204 }));
    return withCors(request, NextResponse.next());
  }
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/uploads")) {
    const allowed = await uploadAccessGranted(
      pathname,
      request.nextUrl.searchParams.get("exp"),
      request.nextUrl.searchParams.get("sig"),
    );
    if (!allowed) return new NextResponse("Not found", { status: 404 });
    return withCors(request, NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await decodeSession(token);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    if (token) url.searchParams.set("reason", "expired");
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/" || pathname === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(user.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user?.role === "MANAGER" && (pathname.startsWith("/admin/employees") || pathname.startsWith("/admin/reports"))) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  if (user && pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "MANAGER") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }
  if (user && pathname.startsWith("/employee") && user.role !== "EMPLOYEE" && user.role !== "ADMIN" && user.role !== "MANAGER") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }
  if (user && pathname.startsWith("/customer") && user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }

  if (isPublic) return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
