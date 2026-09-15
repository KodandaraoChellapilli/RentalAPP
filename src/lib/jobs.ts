export function employeeJobHref(type: string, eventId: string, rentalId?: string | null) {
  if (type === "PICKUP") return `/employee/pickup?eventId=${eventId}&rentalId=${rentalId || ""}`;
  return `/employee/deliver?eventId=${eventId}`;
}

export function adminEventHref(type: string) {
  if (type === "PICKUP") return "/admin/pickups";
  if (type === "DELIVERY") return "/admin/deliveries";
  return "/admin/calendar";
}

export function equipmentLabel(
  equipment?: { number: string; name: string } | null,
  fallback?: string | null,
) {
  if (equipment) return `#${equipment.number} ${equipment.name}`;
  return fallback || "Untitled";
}
