import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, equipment: true, rental: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Payment status for rental charges. Square is not connected." />
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Open a rental and create an invoice from its stored charge." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Rental</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/invoices/${invoice.id}`} className="font-medium text-stone-900">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{invoice.customer.name}</td>
                  <td className="px-4 py-3">
                    #{invoice.equipment.number} {invoice.equipment.name}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(invoice.total)}</td>
                  <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="invoice" status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
