import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createSchedule } from "@/lib/actions/rentals";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocal } from "@/lib/utils";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; equipmentId?: string; type?: string }>;
}) {
  const { error, equipmentId, type } = await searchParams;
  const [equipment, customers, employees, activeRentals] = await Promise.all([
    prisma.equipment.findMany({ orderBy: { number: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "EMPLOYEE", active: true }, orderBy: { name: "asc" } }),
    prisma.rental.findMany({
      where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
      include: { equipment: true, customer: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Schedule a job" subtitle="Assign an employee to a delivery, pickup, or rental window." />
      <ErrorBanner message={error} />
      <form action={createSchedule} className="card space-y-4 p-6">
        <label className="block">
          <span className="field-label">Job type</span>
          <select className="field mt-1.5" name="type" defaultValue={type || "DELIVERY"}>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
            <option value="RENTAL">Rental window</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">Equipment</span>
          <select className="field mt-1.5" name="equipmentId" required defaultValue={equipmentId || ""}>
            <option value="">Select equipment</option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.number} {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Customer</span>
          <select className="field mt-1.5" name="customerId" required>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Existing rental (optional, used for pickups)</span>
          <select className="field mt-1.5" name="rentalId">
            <option value="">None / create new</option>
            {activeRentals.map((rental) => (
              <option key={rental.id} value={rental.id}>
                #{rental.equipment.number} · {rental.customer.name} · {rental.status}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Assign employee</span>
          <select className="field mt-1.5" name="employeeId">
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Date and time</span>
          <input className="field mt-1.5" name="startAt" type="datetime-local" required defaultValue={toDateTimeLocal(new Date())} />
        </label>
        <label className="block">
          <span className="field-label">Expected pickup</span>
          <input className="field mt-1.5" name="expectedPickupAt" type="datetime-local" />
        </label>
        <label className="block">
          <span className="field-label">Destination</span>
          <input className="field mt-1.5" name="destination" placeholder="Jobsite address" />
        </label>
        <label className="block">
          <span className="field-label">Notes</span>
          <textarea className="field mt-1.5" name="notes" rows={3} />
        </label>
        <SubmitButton pendingLabel="Saving…">Save schedule</SubmitButton>
      </form>
    </div>
  );
}
