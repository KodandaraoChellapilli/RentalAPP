import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { durationMs, startOfToday } from "@/lib/utils";
import { ServiceError } from "@/lib/services/errors";
import { revalidateClockSurfaces } from "@/lib/services/revalidate";

export async function getClockState(employeeId: string) {
  const today = startOfToday();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const [open, weekEntries, recent] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { employeeId, clockOut: null },
      orderBy: { clockIn: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { employeeId, clockIn: { gte: weekStart } },
      orderBy: { clockIn: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { employeeId },
      orderBy: { clockIn: "desc" },
      take: 14,
    }),
  ]);

  const todayMs = weekEntries
    .filter((entry) => new Date(entry.clockIn) >= today)
    .reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);
  const weekMs = weekEntries.reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);

  return {
    clockedIn: Boolean(open),
    openEntry: open,
    todayMs,
    weekMs,
    recent,
  };
}

export async function clockInService(employeeId: string) {
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
  });
  if (open) throw new ServiceError("You are already clocked in.");
  const entry = await prisma.timeEntry.create({
    data: { employeeId, clockIn: new Date() },
  });
  revalidateClockSurfaces();
  return entry;
}

export async function clockOutService(employeeId: string) {
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) throw new ServiceError("You are not clocked in.");
  const entry = await prisma.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
  });
  revalidateClockSurfaces();
  return entry;
}
