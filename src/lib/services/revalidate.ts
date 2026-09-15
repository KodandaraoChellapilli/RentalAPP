import { revalidatePath } from "next/cache";

export function revalidateRentalSurfaces(equipmentId?: string, rentalId?: string, customerId?: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/rentals");
  revalidatePath("/admin/deliveries");
  revalidatePath("/admin/pickups");
  revalidatePath("/admin/reports");
  revalidatePath("/employee/jobs");
  revalidatePath("/employee/deliver");
  revalidatePath("/employee/pickup");
  revalidatePath("/employee/equipment");
  revalidatePath("/customer/rentals");
  if (equipmentId) revalidatePath(`/admin/equipment/${equipmentId}`);
  if (rentalId) revalidatePath(`/customer/rentals/${rentalId}`);
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
}

export function revalidateClockSurfaces() {
  revalidatePath("/employee/clock");
  revalidatePath("/admin/hours");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/employees");
}
