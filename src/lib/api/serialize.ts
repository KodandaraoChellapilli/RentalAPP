import { formatDuration, formatMoney, formatRate, rentalCharge } from "@/lib/billing";
import { photoLabelFor } from "@/lib/photo-labels";
import { transportStatus, transportStatusLabel } from "@/lib/transports";

export function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function absoluteUrl(origin: string, path: string) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function photoJson(
  photo: {
    id: string;
    type: string;
    path: string;
    takenAt: Date | string;
    notes?: string | null;
    uploadedBy?: { name: string } | null;
  },
  origin: string,
) {
  return {
    id: photo.id,
    type: photo.type,
    label: photoLabelFor(photo.type),
    url: absoluteUrl(origin, photo.path),
    takenAt: iso(photo.takenAt),
    notes: photo.notes || null,
    uploadedByName: photo.uploadedBy?.name || null,
  };
}

export function equipmentSummary(
  equipment: {
    id: string;
    number: string;
    name: string;
    type: string;
    status: string;
    rate: number;
    billingUnit: string;
    notes?: string | null;
    photos?: Array<{ path: string }>;
  },
  origin?: string,
) {
  const latest = equipment.photos?.[0];
  return {
    id: equipment.id,
    number: equipment.number,
    name: equipment.name,
    type: equipment.type,
    status: equipment.status,
    rate: equipment.rate,
    billingUnit: equipment.billingUnit,
    rateLabel: formatRate(equipment.rate, equipment.billingUnit),
    notes: equipment.notes || null,
    label: `#${equipment.number} ${equipment.name}`,
    photoUrl: latest && origin ? absoluteUrl(origin, latest.path) : null,
  };
}

export function personSummary(person?: { id: string; name: string; email?: string | null; phone?: string | null } | null) {
  if (!person) return null;
  return {
    id: person.id,
    name: person.name,
    email: person.email || null,
    phone: person.phone || null,
  };
}

export function rentalJson(
  rental: {
    id: string;
    status: string;
    destination?: string | null;
    startAt?: Date | string | null;
    endAt?: Date | string | null;
    expectedPickupAt?: Date | string | null;
    rateSnapshot: number;
    billingUnitSnapshot: string;
    finalAmount?: number | null;
    notes?: string | null;
    equipment?: Parameters<typeof equipmentSummary>[0];
    customer?: { id: string; name: string; email?: string | null; phone?: string | null };
  },
  extra?: Record<string, unknown>,
) {
  const charge = rentalCharge(
    rental.startAt || null,
    rental.endAt || null,
    rental.rateSnapshot,
    rental.billingUnitSnapshot,
    rental.status,
    rental.finalAmount,
  );
  return {
    id: rental.id,
    status: rental.status,
    destination: rental.destination || null,
    startAt: iso(rental.startAt),
    endAt: iso(rental.endAt),
    expectedPickupAt: iso(rental.expectedPickupAt),
    rate: rental.rateSnapshot,
    billingUnit: rental.billingUnitSnapshot,
    rateLabel: formatRate(rental.rateSnapshot, rental.billingUnitSnapshot),
    notes: rental.notes || null,
    charge: {
      amount: charge.amount,
      formatted: formatMoney(charge.amount),
      isEstimate: charge.isEstimate,
      durationMs: charge.durationMs,
      durationLabel: formatDuration(charge.durationMs),
      billedUnits: charge.billedUnits,
      unitLabel: charge.unitLabel,
    },
    equipment: rental.equipment ? equipmentSummary(rental.equipment) : null,
    customer: personSummary(rental.customer),
    ...extra,
  };
}

export function eventJson(
  event: {
    id: string;
    type: string;
    title?: string | null;
    startAt: Date | string;
    completedAt?: Date | string | null;
    destination?: string | null;
    notes?: string | null;
    rentalId?: string | null;
    employeeId?: string | null;
    source?: string | null;
    customerConfirmedAt?: Date | string | null;
    equipment?: Parameters<typeof equipmentSummary>[0] | null;
    customer?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
    employee?: { id: string; name: string } | null;
    rental?: Parameters<typeof rentalJson>[0] | null;
  },
) {
  const status = transportStatus(event);
  const customerRequested =
    event.source === "CUSTOMER" || Boolean(event.notes?.includes("Customer requested pickup"));
  return {
    id: event.id,
    type: event.type,
    title: event.title || null,
    startAt: iso(event.startAt),
    completedAt: iso(event.completedAt),
    destination: event.destination || null,
    notes: event.notes || null,
    rentalId: event.rentalId || null,
    source: customerRequested ? "CUSTOMER" : event.source || "STAFF",
    customerConfirmedAt: iso(event.customerConfirmedAt),
    status,
    statusLabel: transportStatusLabel(status),
    equipment: event.equipment ? equipmentSummary(event.equipment) : null,
    customer: personSummary(event.customer),
    employee: event.employee ? { id: event.employee.id, name: event.employee.name } : null,
    rental: event.rental ? rentalJson(event.rental) : null,
  };
}

export function rentalHistoryJson(
  rental: Parameters<typeof rentalJson>[0] & {
    photos?: Parameters<typeof photoJson>[0][];
    events?: Array<{
      id: string;
      type: string;
      startAt: Date | string;
      completedAt?: Date | string | null;
      notes?: string | null;
      employee?: { name: string } | null;
    }>;
    invoice?: { id: string; number: string; status: string; total: number } | null;
  },
  origin: string,
) {
  const photos = rental.photos || [];
  const events = rental.events || [];
  const before = photos.filter((photo) => photo.type === "DELIVERY");
  const after = photos.filter((photo) => photo.type === "PICKUP");
  const delivery = events.find((event) => event.type === "DELIVERY");
  const pickup = events.find((event) => event.type === "PICKUP");
  return rentalJson(rental, {
    deliveredBy: delivery?.employee?.name || before[0]?.uploadedBy?.name || null,
    pickedUpBy: pickup?.employee?.name || after[0]?.uploadedBy?.name || null,
    conditionNotes: rental.notes || null,
    beforePhotos: before.map((photo) => photoJson(photo, origin)),
    afterPhotos: after.map((photo) => photoJson(photo, origin)),
    photos: photos.map((photo) => photoJson(photo, origin)),
    invoice: rental.invoice
      ? { id: rental.invoice.id, number: rental.invoice.number, status: rental.invoice.status, total: rental.invoice.total }
      : null,
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      startAt: iso(event.startAt),
      completedAt: iso(event.completedAt),
      employeeName: event.employee?.name || null,
      notes: event.notes || null,
    })),
  });
}

export function timeEntryJson(entry: {
  id: string;
  clockIn: Date | string;
  clockOut?: Date | string | null;
  notes?: string | null;
}) {
  const duration = entry.clockOut
    ? new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()
    : Date.now() - new Date(entry.clockIn).getTime();
  return {
    id: entry.id,
    clockIn: iso(entry.clockIn),
    clockOut: iso(entry.clockOut),
    notes: entry.notes || null,
    durationMs: Math.max(0, duration),
    durationLabel: formatDuration(Math.max(0, duration)),
    running: !entry.clockOut,
  };
}

export function confirmed(value: FormDataEntryValue | null) {
  const text = String(value || "").toLowerCase();
  return text === "on" || text === "true" || text === "1" || text === "yes";
}
