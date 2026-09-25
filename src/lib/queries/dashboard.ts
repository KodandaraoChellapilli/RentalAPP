import { rentalCharge } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { durationMs, endOfToday, startOfToday } from "@/lib/utils";

export async function getOwnerDashboard() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const [equipment, activeRentals, completedRentals, openEvents, todayEvents, employees] = await Promise.all([
    prisma.equipment.findMany({
      orderBy: { number: "asc" },
      include: { photos: { orderBy: { takenAt: "desc" }, take: 1 } },
    }),
    prisma.rental.findMany({
      where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
      include: { equipment: true, customer: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.rental.findMany({
      where: { status: "COMPLETED", endAt: { gte: todayStart } },
    }),
    prisma.scheduleEvent.findMany({
      where: { completedAt: null },
      include: { equipment: true, customer: true, employee: true, rental: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.scheduleEvent.findMany({
      where: { startAt: { gte: todayStart, lte: todayEnd } },
      include: { equipment: true, customer: true, employee: true, rental: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE", active: true },
      include: {
        timeEntries: {
          where: { clockIn: { gte: todayStart } },
          orderBy: { clockIn: "desc" },
        },
        assignedEvents: {
          where: { completedAt: null, startAt: { gte: todayStart, lte: todayEnd } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const availableEquipment = equipment.filter((item) => item.status === "AVAILABLE");
  const needingAttention = equipment.filter(
    (item) => item.status === "MAINTENANCE" || item.status === "OUT_OF_SERVICE",
  );
  const openDeliveries = openEvents.filter((event) => event.type === "DELIVERY");
  const openPickups = openEvents.filter((event) => event.type === "PICKUP");
  const overdue = openEvents.filter((event) => event.startAt < new Date());
  const clockedIn = employees.filter((employee) => employee.timeEntries.some((entry) => !entry.clockOut));

  const estimatedCharges = activeRentals
    .filter((rental) => rental.status === "ACTIVE")
    .reduce(
      (sum, rental) =>
        sum +
        rentalCharge(rental.startAt, null, rental.rateSnapshot, rental.billingUnitSnapshot, rental.status, rental.finalAmount)
          .amount,
      0,
    );

  return {
    counts: {
      available: availableEquipment.length,
      scheduled: equipment.filter((item) => item.status === "SCHEDULED").length,
      onRent: equipment.filter((item) => item.status === "ON_RENT").length,
      pickup: equipment.filter((item) => item.status === "PICKUP_SCHEDULED").length,
      maintenance: equipment.filter((item) => item.status === "MAINTENANCE").length,
      out: equipment.filter((item) => item.status === "OUT_OF_SERVICE").length,
      equipment: equipment.length,
      activeRentals: activeRentals.filter((rental) => rental.status === "ACTIVE").length,
      scheduledRentals: activeRentals.filter((rental) => rental.status === "SCHEDULED").length,
      openDeliveries: openDeliveries.length,
      openPickups: openPickups.length,
      todayJobs: todayEvents.length,
      needingAttention: needingAttention.length,
    },
    estimatedCharges,
    completedTodayCount: completedRentals.length,
    completedTodayAmount: completedRentals.reduce((sum, rental) => sum + (rental.finalAmount || 0), 0),
    activeRentals,
    todayEvents,
    todayDeliveries: todayEvents.filter((event) => event.type === "DELIVERY").length,
    todayPickups: todayEvents.filter((event) => event.type === "PICKUP").length,
    openEvents: openEvents.slice(0, 8),
    overdueCount: overdue.length,
    availableEquipment: availableEquipment.slice(0, 6),
    needingAttention,
    employees: employees.map((employee) => {
      const open = employee.timeEntries.find((entry) => !entry.clockOut);
      return {
        id: employee.id,
        name: employee.name,
        clockedIn: Boolean(open),
        todayMs: employee.timeEntries.reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0),
        jobsToday: employee.assignedEvents.length,
      };
    }),
    clockedInCount: clockedIn.length,
  };
}
