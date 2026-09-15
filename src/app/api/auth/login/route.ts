import { NextRequest } from "next/server";
import { fail, json, options } from "@/lib/api/http";
import { loginService } from "@/lib/services/auth";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "");
    const password = String(body.password || "");
    const result = await loginService(email, password);
    return json({ token: result.token, user: result.user });
  } catch (error) {
    return fail(error);
  }
}
