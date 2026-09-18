export const TRANSPORT_TYPES = ["DELIVERY", "PICKUP"] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const TRANSPORT_STATUSES = ["NEEDS_TRANSPORT", "SCHEDULED", "COMPLETED"] as const;
export type TransportStatus = (typeof TRANSPORT_STATUSES)[number];

export const TRANSPORT_STATUS_LABELS: Record<TransportStatus, string> = {
  NEEDS_TRANSPORT: "Needs transport",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
};

export function isTransportType(value: string): value is TransportType {
  return value === "DELIVERY" || value === "PICKUP";
}

export function transportStatus(event: {
  completedAt?: Date | string | null;
  employeeId?: string | null;
}): TransportStatus {
  if (event.completedAt) return "COMPLETED";
  if (event.employeeId) return "SCHEDULED";
  return "NEEDS_TRANSPORT";
}

export function transportStatusLabel(status: string) {
  return TRANSPORT_STATUS_LABELS[status as TransportStatus] || status;
}
