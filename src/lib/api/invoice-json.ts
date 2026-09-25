import { iso } from "@/lib/api/serialize";

export function invoiceJson(invoice: {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  total: number;
  dueDate: Date | string;
  notes?: string | null;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  customer?: { id: string; name: string };
  equipment?: { id: string; number: string; name: string };
  rental?: { id: string; status: string; startAt?: Date | string | null; endAt?: Date | string | null; expectedPickupAt?: Date | string | null };
  lines?: Array<{ id: string; description: string; quantity: number; unitAmount: number; amount: number }>;
}) {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    subtotal: invoice.subtotal,
    total: invoice.total,
    dueDate: iso(invoice.dueDate),
    notes: invoice.notes || null,
    paidAt: iso(invoice.paidAt),
    createdAt: iso(invoice.createdAt),
    customer: invoice.customer ? { id: invoice.customer.id, name: invoice.customer.name } : null,
    equipment: invoice.equipment
      ? { id: invoice.equipment.id, number: invoice.equipment.number, name: invoice.equipment.name }
      : null,
    rental: invoice.rental
      ? {
          id: invoice.rental.id,
          status: invoice.rental.status,
          startAt: iso(invoice.rental.startAt),
          endAt: iso(invoice.rental.endAt),
          expectedPickupAt: iso(invoice.rental.expectedPickupAt),
        }
      : null,
    lines: (invoice.lines || []).map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      amount: line.amount,
    })),
  };
}
