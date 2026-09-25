export const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const EQUIPMENT_STATUSES = [
  "AVAILABLE",
  "SCHEDULED",
  "ON_RENT",
  "PICKUP_SCHEDULED",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const BILLING_UNITS = ["HOURLY", "DAILY", "WEEKLY"] as const;
export type BillingUnit = (typeof BILLING_UNITS)[number];

export const RENTAL_STATUSES = ["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const EVENT_TYPES = ["DELIVERY", "PICKUP", "RENTAL"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const PHOTO_TYPES = ["DELIVERY", "PICKUP"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  AVAILABLE: "Available",
  SCHEDULED: "Scheduled",
  ON_RENT: "Active / On Rent",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Out of Service",
};

export const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
};

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
  RENTAL: "Rental",
};

export const INVOICE_STATUSES = ["UNPAID", "PAID", "OVERDUE", "CANCELLED", "PARTIAL"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const SETTABLE_INVOICE_STATUSES = ["UNPAID", "PAID"] as const;
export type SettableInvoiceStatus = (typeof SETTABLE_INVOICE_STATUSES)[number];

export const DOCUMENT_TYPES = ["CERTIFICATE_OF_INSURANCE"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  PARTIAL: "Partial",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CERTIFICATE_OF_INSURANCE: "Certificate of Insurance",
};

export function homeFor(role: Role) {
  if (role === "ADMIN" || role === "MANAGER") return "/admin/dashboard";
  if (role === "EMPLOYEE") return "/employee/clock";
  return "/customer/rentals";
}

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}
