import { notFound } from "next/navigation";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateEmployee } from "@/lib/actions/people";
import { formatDuration } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      timeEntries: { orderBy: { clockIn: "desc" }, take: 20 },
      assignedEvents: {
        include: { equipment: true, customer: true },
        orderBy: { startAt: "desc" },
        take: 20,
      },
    },
  });
  if (!employee || employee.role !== "EMPLOYEE") notFound();
  const open = employee.timeEntries.find((entry) => !entry.clockOut);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = employee.timeEntries
    .filter((entry) => new Date(entry.clockIn) >= todayStart)
    .reduce((sum, entry) => {
      const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
      return sum + Math.max(0, end - new Date(entry.clockIn).getTime());
    }, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader title={employee.name} subtitle="Employee profile, clock status, and assignments." />
        <p className={`mb-4 rounded-xl px-4 py-3 text-sm ${open ? "bg-emerald-50 text-emerald-800" : "bg-stone-50 text-stone-600"}`}>
          {open ? `Clocked in · ${formatDuration(todayMs)} today` : `Off clock · ${formatDuration(todayMs)} today`}
        </p>
        <ErrorBanner message={error} />
        <form action={updateEmployee} className="card space-y-4 p-6">
          <input type="hidden" name="id" value={employee.id} />
          <label className="block">
            <span className="field-label">Name</span>
            <input className="field mt-1.5" name="name" required defaultValue={employee.name} />
          </label>
          <label className="block">
            <span className="field-label">Email</span>
            <input className="field mt-1.5" name="email" type="email" required defaultValue={employee.email} />
          </label>
          <label className="block">
            <span className="field-label">Phone</span>
            <input className="field mt-1.5" name="phone" defaultValue={employee.phone ?? ""} />
          </label>
          <label className="block">
            <span className="field-label">Status</span>
            <select className="field mt-1.5" name="active" defaultValue={employee.active ? "true" : "false"}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Reset password</span>
            <input className="field mt-1.5" name="password" type="password" minLength={8} placeholder="Leave blank to keep current" />
          </label>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </form>
      </div>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-semibold">Assigned jobs</h2>
          <div className="card divide-y divide-stone-100">
            {employee.assignedEvents.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">No assigned jobs yet.</p>
            ) : (
              employee.assignedEvents.map((event) => (
              <div key={event.id} className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {event.type} {event.equipment ? `#${event.equipment.number}` : ""}
                </p>
                <p className="text-stone-500">
                  {formatDateTime(event.startAt)} · {event.customer?.name || "No customer"}
                </p>
              </div>
              ))
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Recent hours</h2>
          <div className="card divide-y divide-stone-100">
            {employee.timeEntries.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">No punches recorded yet.</p>
            ) : (
              employee.timeEntries.map((entry) => {
              const duration = entry.clockOut
                ? new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()
                : Date.now() - new Date(entry.clockIn).getTime();
              return (
                <div key={entry.id} className="flex justify-between px-4 py-3 text-sm">
                  <div>
                    <p>{formatDateTime(entry.clockIn)}</p>
                    <p className="text-stone-500">{entry.clockOut ? formatDateTime(entry.clockOut) : "Clocked in"}</p>
                  </div>
                  <p className="font-medium">{formatDuration(duration)}</p>
                </div>
              );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
