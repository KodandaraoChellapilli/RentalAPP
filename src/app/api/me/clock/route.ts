import { NextRequest } from "next/server";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { requireStaff } from "@/lib/api/access";
import { formatDuration } from "@/lib/billing";
import { timeEntryJson } from "@/lib/api/serialize";
import { getClockState } from "@/lib/services/clock";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    const state = await getClockState(user.id);
    return json({
      clockedIn: state.clockedIn,
      todayMs: state.todayMs,
      weekMs: state.weekMs,
      todayLabel: formatDuration(state.todayMs),
      weekLabel: formatDuration(state.weekMs),
      openEntry: state.openEntry ? timeEntryJson(state.openEntry) : null,
      recent: state.recent.map(timeEntryJson),
    });
  } catch (error) {
    return fail(error);
  }
}
