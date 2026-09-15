import Link from "next/link";
import { startOfWeek } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function HoursPage() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      timeEntries: {
        where: { clockIn: { gte: weekStart } },
        orderBy: { clockIn: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Employee hours" subtitle="Clock in/out is tracked separately from equipment jobs." />
      <div className="space-y-6">
        {employees.length === 0 ? (
          <EmptyState
            title="No employees"
            body="Add crew members to start tracking clock-in hours."
            action={{ href: "/admin/employees/new", label: "Add employee" }}
          />
        ) : (
          employees.map((employee) => {
          const weekMs = employee.timeEntries.reduce((sum, entry) => {
            const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
            return sum + Math.max(0, end - new Date(entry.clockIn).getTime());
          }, 0);
          const clockedIn = employee.timeEntries.some((entry) => !entry.clockOut);
          return (
            <section key={employee.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Link className="font-semibold" href={`/admin/employees/${employee.id}`}>
                    {employee.name}
                  </Link>
                  <p className="text-sm text-stone-500">{employee.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">This week {formatDuration(weekMs)}</p>
                  {clockedIn ? <p className="text-xs font-medium text-emerald-700">Clocked in</p> : null}
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {employee.timeEntries.length === 0 ? (
                  <p className="py-2 text-sm text-stone-500">No punches this week.</p>
                ) : (
                  employee.timeEntries.map((entry) => {
                    const duration =
                      (entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now()) -
                      new Date(entry.clockIn).getTime();
                    return (
                      <div key={entry.id} className="flex justify-between py-2 text-sm">
                        <span>
                          {formatDateTime(entry.clockIn)} → {entry.clockOut ? formatDateTime(entry.clockOut) : "In progress"}
                        </span>
                        <span className="font-medium">{formatDuration(duration)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
          })
        )}
      </div>
    </div>
  );
}
