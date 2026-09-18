import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, type Role } from "@/lib/constants";
import { hydrateSessionUser } from "@/lib/hydrate-session";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
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
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return hydrateSessionUser(await decodeSession(jar.get(SESSION_COOKIE)?.value));
}

export async function requireUser(roles?: Role[]) {
  const user = await getSession();
  if (!user) redirect("/login?reason=expired");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
