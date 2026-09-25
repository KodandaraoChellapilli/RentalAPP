import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/errors";
import { buildInvoiceDraft, defaultDueDate, formatInvoiceNumber, nextInvoiceSequence, parseInvoiceStatus } from "@/lib/invoices";

const invoiceInclude = {
  customer: true,
  equipment: true,
  rental: true,
  lines: true,
} as const;

export async function listInvoices(customerId?: string | null) {
  return prisma.invoice.findMany({
    where: customerId ? { customerId } : undefined,
    include: invoiceInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw new ServiceError("Invoice not found.", 404);
  return invoice;
}

export async function createInvoiceForRental(opts: { rentalId: string; dueDate?: Date | null; notes?: string | null }) {
  const rental = await prisma.rental.findUnique({
    where: { id: opts.rentalId },
    include: { equipment: true, customer: true, invoice: true },
  });
  if (!rental) throw new ServiceError("Rental not found.", 404);
  if (rental.invoice) throw new ServiceError("This rental already has an invoice.", 409);
  if (rental.status === "CANCELLED") throw new ServiceError("Cancelled rentals cannot be invoiced.", 400);

  const draft = buildInvoiceDraft(rental);
  const existing = await prisma.invoice.findMany({ select: { number: true } });
  const number = formatInvoiceNumber(nextInvoiceSequence(existing.map((item) => item.number)));
  const dueDate = opts.dueDate && !Number.isNaN(opts.dueDate.getTime()) ? opts.dueDate : defaultDueDate(rental);

  return prisma.invoice.create({
    data: {
      number,
      customerId: rental.customerId,
      rentalId: rental.id,
      equipmentId: rental.equipmentId,
      status: "UNPAID",
      subtotal: draft.subtotal,
      total: draft.total,
      dueDate,
      notes: opts.notes || null,
      lines: { create: draft.line },
    },
    include: invoiceInclude,
  });
}

export async function setInvoiceStatus(id: string, statusValue: string) {
  const status = parseInvoiceStatus(statusValue);
  if (!status) throw new ServiceError("Status must be Paid or Unpaid.", 400);
  await getInvoice(id);
  return prisma.invoice.update({
    where: { id },
    data: { status, paidAt: status === "PAID" ? new Date() : null },
    include: invoiceInclude,
  });
}

export async function invoiceSummary() {
  const invoices = await prisma.invoice.findMany({ select: { status: true, total: true } });
  const paid = invoices.filter((invoice) => invoice.status === "PAID");
  const unpaid = invoices.filter((invoice) => invoice.status === "UNPAID");
  return {
    total: invoices.length,
    paid: paid.length,
    unpaid: unpaid.length,
    outstanding: unpaid.reduce((sum, invoice) => sum + invoice.total, 0),
  };
}
