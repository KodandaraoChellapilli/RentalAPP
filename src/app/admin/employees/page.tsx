import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { durationMs, startOfToday } from "@/lib/utils";

export default async function EmployeesPage() {
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

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Clock status, today's hours, and assigned deliveries and pickups."
        action={{ href: "/admin/employees/new", label: "Add employee" }}
      />
      {employees.length === 0 ? (
        <EmptyState
          title="No employees yet"
          body="Add a crew member so they can clock in and complete field jobs."
          action={{ href: "/admin/employees/new", label: "Add employee" }}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock</th>
                <th>Today's hours</th>
                <th>Open jobs</th>
                <th>Assignments</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const open = employee.timeEntries.find((entry) => !entry.clockOut);
                const todayMs = employee.timeEntries.reduce((sum, entry) => sum + durationMs(entry.clockIn, entry.clockOut), 0);
                const deliveries = employee.assignedEvents.filter((event) => event.type === "DELIVERY");
                const pickups = employee.assignedEvents.filter((event) => event.type === "PICKUP");
                return (
                  <tr key={employee.id}>
                    <td>
                      <Link className="font-semibold text-stone-900" href={`/admin/employees/${employee.id}`}>
                        {employee.name}
                      </Link>
                      <p className="text-xs text-stone-500">{employee.email}</p>
                      {!employee.active ? <p className="text-xs text-stone-400">Inactive</p> : null}
                    </td>
                    <td>
                      <span className={open ? "font-medium text-emerald-700" : "text-stone-500"}>
                        {open ? "Clocked in" : "Off clock"}
                      </span>
                    </td>
                    <td>{formatDuration(todayMs)}</td>
                    <td>{employee.assignedEvents.length}</td>
                    <td className="text-sm text-stone-600">
                      {deliveries.length ? `${deliveries.length} delivery` : null}
                      {deliveries.length && pickups.length ? " · " : null}
                      {pickups.length ? `${pickups.length} pickup` : null}
                      {!employee.assignedEvents.length ? "None" : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
