import Link from "next/link";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { AttentionBanner, DataTable, Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatDuration, formatMoney, formatRate, rentalCharge } from "@/lib/billing";
import { adminEventHref, equipmentLabel } from "@/lib/jobs";
import type { getOwnerDashboard } from "@/lib/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

type Dashboard = Awaited<ReturnType<typeof getOwnerDashboard>>;

export function OwnerDashboard({ data }: { data: Dashboard }) {
  const { counts } = data;
  const asOf = Date.now();
  const todayTransportCount = data.todayDeliveries + data.todayPickups;

  return (
    <div className="space-y-5">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-stone-500">Active rentals and transports for today first.</p>
        <Link href="/admin/schedule/new" className="btn btn-primary">
          Schedule transport
        </Link>
      </div>

      {data.overdueCount ? (
        <AttentionBanner>
          {data.overdueCount} transport{data.overdueCount === 1 ? " is" : "s are"} overdue.
        </AttentionBanner>
      ) : null}

      <div className="ops-strip">
        <StatCard title="Invoices" value={data.invoices.total} subtitle={`${data.invoices.paid} paid`} href="/admin/invoices" />
        <StatCard
          title="Unpaid"
          value={data.invoices.unpaid}
          subtitle={`${formatMoney(data.invoices.outstanding)} outstanding`}
          href="/admin/invoices"
        />
      </div>

      <div className="ops-strip">
        <StatCard
          title="Active rentals"
          value={counts.activeRentals}
          subtitle={`${counts.scheduledRentals} scheduled`}
          href="/admin/rentals"
          primary
        />
        <StatCard
          title="On rent now"
          value={counts.onRent ?? counts.activeRentals}
          subtitle={`${formatMoney(data.estimatedCharges)} estimated`}
          href="/admin/rentals"
        />
        <StatCard
          title="Today's transports"
          value={todayTransportCount}
          subtitle={`${data.todayDeliveries} delivery · ${data.todayPickups} pickup`}
          href="/admin/transports"
        />
        <StatCard
          title="Needs attention"
          value={counts.needingAttention}
          subtitle={`${data.clockedInCount} clocked in`}
          href={counts.needingAttention ? "/admin/equipment" : "/admin/hours"}
        />
      </div>

      <Panel
        title="Active rentals"
        subtitle="Equipment currently out or scheduled."
        action={{ href: "/admin/rentals", label: "All rentals" }}
        padded={false}
      >
        <DataTable>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Customer</th>
              <th>Start</th>
              <th>Duration</th>
              <th>Expected pickup</th>
              <th>Status</th>
              <th>Current amount</th>
            </tr>
          </thead>
          <tbody>
            {data.activeRentals.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-stone-500" colSpan={7}>
                  No active or scheduled rentals.
                </td>
              </tr>
            ) : (
              data.activeRentals.map((rental) => {
                const charge = rentalCharge(
                  rental.startAt,
                  rental.endAt,
                  rental.rateSnapshot,
                  rental.billingUnitSnapshot,
                  rental.status,
                  rental.finalAmount,
                  asOf,
                );
                return (
                  <tr key={rental.id}>
                    <td>
                      <Link className="font-medium text-stone-900" href={`/admin/equipment/${rental.equipmentId}`}>
                        {equipmentLabel(rental.equipment)}
                      </Link>
                      <p className="text-xs text-stone-500">{formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}</p>
                    </td>
                    <td className="max-w-[12rem] truncate">{rental.customer.name}</td>
                    <td>{formatDateTime(rental.startAt)}</td>
                    <td>{rental.startAt ? formatDuration(charge.durationMs) : "—"}</td>
                    <td>{formatDateTime(rental.expectedPickupAt)}</td>
                    <td>
                      <StatusBadge kind="rental" status={rental.status} />
                    </td>
                    <td>
                      {rental.status === "ACTIVE" ? (
                        <LiveCharge
                          compact
                          asOf={asOf}
                          startAt={rental.startAt}
                          rate={rental.rateSnapshot}
                          unit={rental.billingUnitSnapshot}
                          status={rental.status}
                          finalAmount={rental.finalAmount}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </Panel>

      <Panel
        title="Today's transports"
        subtitle="Deliveries and pickups scheduled for today."
        action={{ href: "/admin/transports", label: "All transports" }}
        padded={false}
      >
        {data.todayEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-stone-500">No deliveries or pickups scheduled today.</p>
        ) : (
          <DataTable minWidth="640px">
            <thead>
              <tr>
                <th>Type</th>
                <th>Equipment</th>
                <th>Customer</th>
                <th>When</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {data.todayEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <TypeBadge type={event.type} />
                  </td>
                  <td>
                    <Link className="font-medium text-stone-900" href={adminEventHref(event.type)}>
                      {equipmentLabel(event.equipment, event.title)}
                    </Link>
                  </td>
                  <td className="max-w-[12rem] truncate">{event.customer?.name || "—"}</td>
                  <td>{formatDateTime(event.startAt)}</td>
                  <td>{event.employee?.name || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Crew" subtitle={`${data.clockedInCount} clocked in`} action={{ href: "/admin/hours", label: "Time clock" }} padded={false}>
          {data.employees.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500">No employees yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`/admin/employees/${employee.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{employee.name}</p>
                    <p className="text-stone-500">
                      {employee.jobsToday ? `${employee.jobsToday} job${employee.jobsToday === 1 ? "" : "s"} today` : "No jobs today"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={employee.clockedIn ? "font-medium text-emerald-700" : "text-stone-500"}>
                      {employee.clockedIn ? "Clocked in" : "Off clock"}
                    </p>
                    <p className="text-stone-500">{formatDuration(employee.todayMs)} today</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Attention"
          subtitle="Maintenance and out-of-service equipment."
          action={{ href: "/admin/equipment", label: "All equipment" }}
          padded={false}
        >
          {data.needingAttention.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500">No machines need attention.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.needingAttention.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/equipment/${item.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      #{item.number} {item.name}
                    </p>
                    <p className="truncate text-stone-500">{formatRate(item.rate, item.billingUnit)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
