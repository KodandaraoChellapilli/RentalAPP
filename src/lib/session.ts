import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, type Role } from "@/lib/constants";
import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  type SessionUser,
} from "@/lib/session-token";

export type { SessionUser };

export async function setSession(user: SessionUser) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(roles?: Role[]) {
  const user = await getSession();
  if (!user) redirect("/login?reason=expired");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
