import { NextRequest } from "next/server";
import { requireStaff } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { equipmentSummary } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = requireStaff(await requireApiUser(request, ["EMPLOYEE", "ADMIN"]));
    if (user.role === "ADMIN") {
      const equipment = await prisma.equipment.findMany({ orderBy: { number: "asc" } });
      return json({ equipment: equipment.map(equipmentSummary) });
    }

    const jobs = await prisma.scheduleEvent.findMany({
      where: { employeeId: user.id, equipmentId: { not: null } },
      include: { equipment: true, customer: true },
      orderBy: { startAt: "desc" },
      take: 40,
    });
    const byId = new Map<string, (typeof jobs)[number]>();
    for (const job of jobs) {
      if (job.equipmentId && job.equipment && !byId.has(job.equipmentId)) byId.set(job.equipmentId, job);
    }
    return json({
      equipment: [...byId.values()].map((job) => ({
        ...equipmentSummary(job.equipment!),
        customerName: job.customer?.name || null,
        latestJobId: job.id,
        latestJobType: job.type,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
