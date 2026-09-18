import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { eventJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { isTransportType } from "@/lib/transports";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOwner(await requireApiUser(request, ["ADMIN"]));
    const type = request.nextUrl.searchParams.get("type");
    const events = await prisma.scheduleEvent.findMany({
      where: {
        type: type && isTransportType(type) ? type : { in: ["DELIVERY", "PICKUP"] },
      },
      include: { equipment: true, customer: true, employee: true, rental: true },
      orderBy: { startAt: "desc" },
    });
    return json({ transports: events.map(eventJson) });
  } catch (error) {
    return fail(error);
  }
}
