import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateInvoiceStatus } from "@/lib/actions/invoices";
import { formatMoney, formatRate } from "@/lib/billing";
import { squareIntegrationStatus } from "@/lib/integrations/square";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, equipment: true, rental: true, lines: true },
  });
  if (!invoice) notFound();
  const square = squareIntegrationStatus();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={invoice.number}
        subtitle={`${invoice.customer.name} · #${invoice.equipment.number} ${invoice.equipment.name}`}
      />
      <ErrorBanner message={error} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge kind="invoice" status={invoice.status} />
        <span className="text-sm text-stone-500">Created {formatDate(invoice.createdAt)}</span>
      </div>
      <section className="card mb-4 p-5 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Customer</dt>
            <dd>
              <Link href={`/admin/customers/${invoice.customerId}`} className="font-medium">
                {invoice.customer.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Equipment</dt>
            <dd>
              <Link href={`/admin/equipment/${invoice.equipmentId}`} className="font-medium">
                #{invoice.equipment.number} {invoice.equipment.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Rental</dt>
            <dd>
              <Link href={`/admin/equipment/${invoice.equipmentId}`} className="font-medium">
                {formatDate(invoice.rental.startAt)} → {formatDate(invoice.rental.endAt || invoice.rental.expectedPickupAt)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Rate</dt>
            <dd>{formatRate(invoice.rental.rateSnapshot, invoice.rental.billingUnitSnapshot)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Due</dt>
            <dd>{formatDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Paid</dt>
            <dd>{invoice.paidAt ? formatDateTime(invoice.paidAt) : "Not paid"}</dd>
          </div>
        </dl>
        {invoice.notes ? <p className="mt-3 text-stone-600">{invoice.notes}</p> : null}
      </section>
      <section className="card mb-4 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3">{line.description}</td>
                <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between border-t border-stone-200 px-4 py-3 text-sm">
          <span className="text-stone-500">Subtotal</span>
          <span className="tabular-nums">{formatMoney(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between px-4 pb-4 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(invoice.total)}</span>
        </div>
      </section>
      <form action={updateInvoiceStatus} className="card flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="id" value={invoice.id} />
        <label className="text-sm">
          <span className="mb-1 block text-stone-500">Payment status</span>
          <select className="field" name="status" defaultValue={invoice.status === "PAID" ? "PAID" : "UNPAID"}>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </label>
        <SubmitButton pendingLabel="Saving…">Update status</SubmitButton>
      </form>
      <p className="mt-3 text-sm text-stone-500">{square.message}</p>
    </div>
  );
}
