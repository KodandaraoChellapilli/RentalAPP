import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { formatDuration } from "@/lib/billing";
import { durationMs, startOfToday } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOwner(await requireApiUser(request, ["ADMIN"]));
    const todayStart = startOfToday();
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        timeEntries: {
          where: { clockIn: { gte: todayStart } },
          orderBy: { clockIn: "desc" },
        },
        assignedEvents: {
          where: { completedAt: null },
          include: { equipment: true },
          orderBy: { startAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return json({
      employees: employees.map((employee) => {
        const open = employee.timeEntries.find((entry) => !entry.clockOut);
        const todayMs = employee.timeEntries.reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);
        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          active: employee.active,
          clockedIn: Boolean(open),
          todayMs,
          todayLabel: formatDuration(todayMs),
          openJobs: employee.assignedEvents.length,
          assignments: employee.assignedEvents.map((event) => ({
            id: event.id,
            type: event.type,
            title: event.title,
            equipmentLabel: event.equipment ? `#${event.equipment.number} ${event.equipment.name}` : event.title,
          })),
        };
      }),
    });
  } catch (error) {
    return fail(error);
  }
}
