import { NextRequest } from "next/server";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { requireStaff } from "@/lib/api/access";
import { eventJson } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    const jobs = await prisma.scheduleEvent.findMany({
      where: {
        completedAt: null,
        ...(user.role === "EMPLOYEE" ? { employeeId: user.id } : {}),
      },
      include: { equipment: true, customer: true, employee: true, rental: { include: { equipment: true, customer: true } } },
      orderBy: { startAt: "asc" },
    });
    return json({ jobs: jobs.map(eventJson) });
  } catch (error) {
    return fail(error);
  }
}
