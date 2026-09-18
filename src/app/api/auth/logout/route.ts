import { cookies } from "next/headers";
import { json, options } from "@/lib/api/http";
import { SESSION_COOKIE } from "@/lib/session-token";

export function OPTIONS() {
  return options();
}

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return json({ ok: true });
}
