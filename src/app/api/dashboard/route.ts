import { NextRequest } from "next/server";
import { requireOperations } from "@/lib/api/access";
import { fail, json, options, publicOrigin, requireApiUser } from "@/lib/api/http";
import { equipmentSummary, eventJson, rentalJson } from "@/lib/api/serialize";
import { formatDuration, formatMoney } from "@/lib/billing";
import { getOwnerDashboard } from "@/lib/queries/dashboard";

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    requireOperations(await requireApiUser(request, ["ADMIN", "MANAGER"]));
    const origin = publicOrigin(request);
    const data = await getOwnerDashboard();
    return json({
      counts: data.counts,
      estimatedCharges: data.estimatedCharges,
      estimatedChargesLabel: formatMoney(data.estimatedCharges),
      completedTodayCount: data.completedTodayCount,
      completedTodayAmount: data.completedTodayAmount,
      completedTodayAmountLabel: formatMoney(data.completedTodayAmount),
      overdueCount: data.overdueCount,
      clockedInCount: data.clockedInCount,
      todayDeliveries: data.todayDeliveries,
      todayPickups: data.todayPickups,
      activeRentals: data.activeRentals.map((rental) => rentalJson(rental)),
      todayEvents: data.todayEvents.map(eventJson),
      openEvents: data.openEvents.map(eventJson),
      availableEquipment: data.availableEquipment.map((item) => equipmentSummary(item, origin)),
      needingAttention: data.needingAttention.map((item) => equipmentSummary(item, origin)),
      invoices: {
        total: data.invoices.total,
        paid: data.invoices.paid,
        unpaid: data.invoices.unpaid,
        outstanding: data.invoices.outstanding,
        outstandingLabel: formatMoney(data.invoices.outstanding),
      },
      employees: data.employees.map((employee) => ({
        ...employee,
        todayLabel: formatDuration(employee.todayMs),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
