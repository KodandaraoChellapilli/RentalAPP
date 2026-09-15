import { startOfWeek } from "date-fns";
import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/api/access";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { eventJson } from "@/lib/api/serialize";
import { formatDuration, formatMoney, rentalCharge } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/utils";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOwner(await requireApiUser(request, ["ADMIN"]));
    const today = startOfToday(new Date());
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const [equipment, rentals, timeEntries, events] = await Promise.all([
      prisma.equipment.findMany(),
      prisma.rental.findMany(),
      prisma.timeEntry.findMany({ where: { clockIn: { gte: weekStart } } }),
      prisma.scheduleEvent.findMany({
        where: { startAt: { gte: today } },
        include: { equipment: true, customer: true, employee: true, rental: true },
        orderBy: { startAt: "asc" },
        take: 12,
      }),
    ]);

    const active = rentals.filter((rental) => rental.status === "ACTIVE");
    const completed = rentals.filter((rental) => rental.status === "COMPLETED");
    const estimated = active.reduce(
      (sum, rental) =>
        sum +
        rentalCharge(rental.startAt, null, rental.rateSnapshot, rental.billingUnitSnapshot, rental.status, rental.finalAmount)
          .amount,
      0,
    );
    const finals = completed.reduce((sum, rental) => sum + (rental.finalAmount || 0), 0);
    const weekMs = timeEntries.reduce((sum, entry) => {
      const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
      return sum + Math.max(0, end - new Date(entry.clockIn).getTime());
    }, 0);

    return json({
      estimatedCharges: estimated,
      estimatedChargesLabel: formatMoney(estimated),
      activeCount: active.length,
      completedAmount: finals,
      completedAmountLabel: formatMoney(finals),
      completedCount: completed.length,
      weekHoursMs: weekMs,
      weekHoursLabel: formatDuration(weekMs),
      equipmentCount: equipment.length,
      byStatus: {
        AVAILABLE: equipment.filter((item) => item.status === "AVAILABLE").length,
        SCHEDULED: equipment.filter((item) => item.status === "SCHEDULED").length,
        ON_RENT: equipment.filter((item) => item.status === "ON_RENT").length,
        PICKUP_SCHEDULED: equipment.filter((item) => item.status === "PICKUP_SCHEDULED").length,
        MAINTENANCE: equipment.filter((item) => item.status === "MAINTENANCE").length,
        OUT_OF_SERVICE: equipment.filter((item) => item.status === "OUT_OF_SERVICE").length,
      },
      upcoming: events.map(eventJson),
    });
  } catch (error) {
    return fail(error);
  }
}
