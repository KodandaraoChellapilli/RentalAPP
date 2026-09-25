import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { eventJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const events = await prisma.scheduleEvent.findMany({
      include: { equipment: true, customer: true, employee: true, rental: true },
      orderBy: { startAt: "asc" },
    });
    return json({ events: events.map(eventJson) });
  } catch (error) {
    return fail(error);
  }
}
