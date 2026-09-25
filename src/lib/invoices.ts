import { rentalCharge, roundMoney } from "@/lib/billing";
import { SETTABLE_INVOICE_STATUSES, type SettableInvoiceStatus } from "@/lib/constants";

export type InvoiceSource = {
  status: string;
  startAt: Date | string | null;
  endAt: Date | string | null;
  expectedPickupAt?: Date | string | null;
  rateSnapshot: number;
  billingUnitSnapshot: string;
  finalAmount?: number | null;
  equipment: { number: string; name: string };
};

export function buildInvoiceDraft(rental: InvoiceSource, asOf?: Date) {
  const charge = rentalCharge(
    rental.startAt,
    rental.endAt,
    rental.rateSnapshot,
    rental.billingUnitSnapshot,
    rental.status,
    rental.finalAmount,
    asOf,
  );
  const total = roundMoney(charge.amount);
  const quantity = charge.billedUnits > 0 ? charge.billedUnits : 1;
  const unitAmount = charge.billedUnits > 0 ? rental.rateSnapshot : total;
  const description = rental.status === "COMPLETED"
    ? `${rental.equipment.name} #${rental.equipment.number} final charge`
    : `${rental.equipment.name} #${rental.equipment.number} · ${quantity} ${charge.unitLabel}`;

  return {
    subtotal: total,
    total,
    isEstimate: charge.isEstimate,
    line: {
      description,
      quantity,
      unitAmount: roundMoney(unitAmount),
      amount: total,
    },
  };
}

export function defaultDueDate(rental: InvoiceSource, from = new Date()) {
  const basis = rental.endAt || rental.expectedPickupAt || from;
  const due = new Date(basis);
  if (Number.isNaN(due.getTime())) return addDays(from, 14);
  due.setDate(due.getDate() + 14);
  return due;
}

export function parseInvoiceStatus(value: string): SettableInvoiceStatus | null {
  const status = value.trim().toUpperCase();
  return SETTABLE_INVOICE_STATUSES.includes(status as SettableInvoiceStatus)
    ? (status as SettableInvoiceStatus)
    : null;
}

export function formatInvoiceNumber(sequence: number) {
  return `INV-${String(sequence).padStart(4, "0")}`;
}

export function nextInvoiceSequence(numbers: string[]) {
  const max = numbers.reduce((highest, number) => {
    const match = /^INV-(\d+)$/.exec(number);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return max + 1;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
