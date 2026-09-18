import { startOfWeek } from "date-fns";
import { ConfirmForm } from "@/components/ConfirmForm";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { LiveDuration } from "@/components/LiveDuration";
import { MetricChip } from "@/components/ui/Panel";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { clockIn, clockOut } from "@/lib/actions/timeclock";
import { formatDuration } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { durationMs, formatDateTime, startOfToday } from "@/lib/utils";

export default async function ClockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const { error } = await searchParams;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const [entries, weekEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { employeeId: user.id },
      orderBy: { clockIn: "desc" },
      take: 14,
    }),
    prisma.timeEntry.findMany({
      where: { employeeId: user.id, clockIn: { gte: weekStart } },
    }),
  ]);
  const asOf = Date.now();
  const open = entries.find((entry) => !entry.clockOut);
  const todayStart = startOfToday();
  const todayMs = weekEntries
    .filter((entry) => new Date(entry.clockIn) >= todayStart)
    .reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);
  const weekMs = weekEntries.reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Time clock" subtitle="Work hours are separate from deliveries and pickups." />
      <ErrorBanner message={error} />
      <div className="card overflow-hidden">
        <div className={`px-6 py-4 ${open ? "bg-emerald-700 text-white" : "bg-[#14110e] text-white"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
            {open ? "Clocked in" : "Not clocked in"}
          </p>
          <p className="mt-2 text-4xl font-semibold">
            {open ? (
              <LiveDuration startAt={open.clockIn} running asOf={asOf} />
            ) : (
              formatDuration(todayMs)
            )}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {open ? `Started ${formatDateTime(open.clockIn)} · ${formatDuration(todayMs)} today` : `Today so far · ${formatDuration(weekMs)} this week`}
          </p>
        </div>
        <div className="p-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MetricChip label="Today" value={formatDuration(todayMs)} />
            <MetricChip label="This week" value={formatDuration(weekMs)} />
          </div>
          <p className="mb-4 text-sm text-stone-500">
            Work time is separate from rental duration, deliveries, and pickups.
          </p>
          {open ? (
            <ConfirmForm action={clockOut} message="Clock out for the day?" confirmLabel="Clock out">
              <SubmitButton className="w-full" variant="dark" pendingLabel="Clocking out…">
                Clock out
              </SubmitButton>
            </ConfirmForm>
          ) : (
            <form action={clockIn}>
              <SubmitButton className="w-full" pendingLabel="Clocking in…">
                Clock in
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
      <h2 className="mt-8 mb-3 font-semibold">Recent punches</h2>
      <div className="card divide-y divide-stone-100">
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-500">No punches yet. Clock in to start your day.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex justify-between px-4 py-3 text-sm">
              <span>
                {formatDateTime(entry.clockIn)}
                <span className="block text-stone-500">
                  {entry.clockOut ? formatDateTime(entry.clockOut) : "In progress"}
                </span>
              </span>
              <span className="font-medium">
                <LiveDuration startAt={entry.clockIn} endAt={entry.clockOut} running={!entry.clockOut} asOf={asOf} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
