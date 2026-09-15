import { NextRequest } from "next/server";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { requireStaff } from "@/lib/api/access";
import { timeEntryJson } from "@/lib/api/serialize";
import { clockInService } from "@/lib/services/clock";

export function OPTIONS() {
  return options();
}

export async function POST(request: NextRequest) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    const entry = await clockInService(user.id);
    return json({ ok: true, entry: timeEntryJson(entry) });
  } catch (error) {
    return fail(error);
  }
}
