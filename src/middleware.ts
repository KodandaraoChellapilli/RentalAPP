import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-token";
import { homeFor } from "@/lib/constants";

const PUBLIC = ["/login"];
const PROTECTED_PREFIXES = ["/admin", "/employee", "/customer", "/account"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next();
    if (pathname.startsWith("/uploads")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
    return response;
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

  if (user && pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }
  if (user && pathname.startsWith("/employee") && user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }
  if (user && pathname.startsWith("/customer") && user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }

  if (isPublic) return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
