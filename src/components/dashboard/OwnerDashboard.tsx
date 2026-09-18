import Link from "next/link";
import { EquipmentCard } from "@/components/cards/EquipmentCard";
import { JobCard } from "@/components/cards/JobCard";
import { LiveCharge } from "@/components/LiveCharge";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttentionBanner, DataTable, MetricChip, Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { formatDuration, formatMoney, formatRate, rentalCharge } from "@/lib/billing";
import { adminEventHref, equipmentLabel } from "@/lib/jobs";
import type { getOwnerDashboard } from "@/lib/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

type Dashboard = Awaited<ReturnType<typeof getOwnerDashboard>>;

export function OwnerDashboard({ data }: { data: Dashboard }) {
  const { counts } = data;
  const asOf = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yard operations"
        subtitle="Active rentals, today's jobs, crew clock status, and live charges."
        action={{ href: "/admin/schedule/new", label: "New schedule" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active rentals"
          value={counts.activeRentals}
          subtitle={`${counts.scheduledRentals} scheduled`}
          href="/admin/rentals"
          tone="warning"
        />
        <StatCard
          title="Available equipment"
          value={counts.available}
          subtitle={`${counts.equipment} machines total`}
          href="/admin/equipment"
          tone="success"
        />
        <StatCard
          title="Scheduled deliveries"
          value={counts.openDeliveries}
          subtitle={`${data.todayDeliveries} today`}
          href="/admin/transports?type=DELIVERY"
        />
        <StatCard
          title="Scheduled pickups"
          value={counts.openPickups}
          subtitle={`${data.todayPickups} today`}
          href="/admin/transports?type=PICKUP"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's jobs" value={counts.todayJobs} subtitle="Deliveries and pickups" href="/admin/transports" />
        <StatCard
          title="Employees clocked in"
          value={data.clockedInCount}
          subtitle={`${data.employees.length} active crew`}
          href="/admin/hours"
        />
        <StatCard
          title="Current estimated charges"
          value={formatMoney(data.estimatedCharges)}
          subtitle="Active rentals only"
          href="/admin/rentals"
          tone="accent"
        />
        <StatCard
          title="Equipment needing attention"
          value={counts.needingAttention}
          subtitle={`${counts.maintenance} maintenance · ${counts.out} out of service`}
          href="/admin/equipment"
          tone={counts.needingAttention ? "warning" : "default"}
        />
      </div>

      {data.needingAttention.length ? (
        <Panel
          title="Equipment needing attention"
          subtitle="Maintenance and out-of-service machines that should not go back on rent."
          action={{ href: "/admin/equipment", label: "All equipment" }}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.needingAttention.map((item) => (
              <EquipmentCard
                key={item.id}
                href={`/admin/equipment/${item.id}`}
                number={item.number}
                name={item.name}
                type={item.type}
                status={item.status}
                rateLabel={formatRate(item.rate, item.billingUnit)}
                actionLabel="Review machine"
              />
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Today's jobs" subtitle="Deliveries and pickups scheduled for today." action={{ href: "/admin/calendar", label: "Calendar" }}>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MetricChip label="Deliveries" value={data.todayDeliveries} />
            <MetricChip label="Pickups" value={data.todayPickups} />
          </div>
          {data.todayEvents.length === 0 ? (
            <p className="text-sm text-stone-500">No deliveries or pickups scheduled today.</p>
          ) : (
            <div className="space-y-3">
              {data.todayEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-stone-100 px-3 py-2 text-sm">
                  <p className="font-medium">
                    {event.type === "PICKUP" ? "Pickup" : "Delivery"} {equipmentLabel(event.equipment, event.title)}
                  </p>
                  <p className="text-stone-500">
                    {formatDateTime(event.startAt)} · {event.customer?.name || "No customer"} · {event.employee?.name || "Unassigned"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Employees clocked in" subtitle="Work time is separate from rental duration." action={{ href: "/admin/hours", label: "Time clock" }}>
          <p className="mb-4 text-sm text-stone-500">
            {data.clockedInCount} clocked in now · {data.employees.length} active crew
          </p>
          {data.employees.length === 0 ? (
            <p className="text-sm text-stone-500">No employees yet.</p>
          ) : (
            <div className="space-y-2">
              {data.employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`/admin/employees/${employee.id}`}
                  className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2 text-sm hover:bg-stone-50"
                >
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-stone-500">
                      {employee.jobsToday ? `${employee.jobsToday} job${employee.jobsToday === 1 ? "" : "s"} today` : "No jobs today"}
                    </p>
                  </div>
                  <div className="text-right">
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
      </div>

      <Panel
        title="Active rentals"
        subtitle="Equipment, customer, duration, and estimated current charge."
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
                <td className="px-5 py-8 text-stone-500" colSpan={7}>
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
                      <Link className="font-semibold text-stone-900" href={`/admin/equipment/${rental.equipmentId}`}>
                        {equipmentLabel(rental.equipment)}
                      </Link>
                      <p className="text-xs text-stone-500">{formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}</p>
                    </td>
                    <td>{rental.customer.name}</td>
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
        title="Available equipment"
        subtitle="Ready for the next delivery."
        action={{ href: "/admin/equipment", label: "All equipment" }}
      >
        {data.availableEquipment.length === 0 ? (
          <p className="text-sm text-stone-500">No machines are currently available.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.availableEquipment.map((item) => (
              <EquipmentCard
                key={item.id}
                href={`/admin/equipment/${item.id}`}
                number={item.number}
                name={item.name}
                type={item.type}
                status={item.status}
                rateLabel={formatRate(item.rate, item.billingUnit)}
                actionLabel="View machine"
              />
            ))}
          </div>
        )}
      </Panel>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Open assignments</h2>
          <Link href="/admin/calendar" className="text-sm font-medium text-orange-700">
            Open calendar
          </Link>
        </div>
        {data.overdueCount ? (
          <div className="mb-3">
            <AttentionBanner>
              {data.overdueCount} assignment{data.overdueCount === 1 ? " is" : "s are"} overdue.
            </AttentionBanner>
          </div>
        ) : null}
        {data.openEvents.length === 0 ? (
          <EmptyState
            title="No open assignments"
            body="Schedule a delivery or pickup to put work on the calendar."
            action={{ href: "/admin/schedule/new", label: "New schedule" }}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.openEvents.map((event) => (
              <JobCard
                key={event.id}
                id={event.id}
                type={event.type}
                startAt={event.startAt}
                title={event.title}
                equipmentLabel={equipmentLabel(event.equipment, event.title)}
                customerName={event.customer?.name}
                employeeName={event.employee?.name ?? null}
                destination={event.destination}
                href={adminEventHref(event.type)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
