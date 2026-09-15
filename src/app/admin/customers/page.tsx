import { PageHeader } from "@/components/PageHeader";
import { PeopleList } from "@/components/lists/PeopleList";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { rentals: true, users: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Companies that rent equipment. Portal users only see their own rentals."
        action={{ href: "/admin/customers/new", label: "Add customer" }}
      />
      <PeopleList
        searchPlaceholder="Search company, email, or address"
        emptyTitle="No customers yet"
        emptyBody="Add a company so you can schedule rentals and offer portal access."
        emptyAction={{ href: "/admin/customers/new", label: "Add customer" }}
        items={customers.map((customer) => ({
          id: customer.id,
          href: `/admin/customers/${customer.id}`,
          title: customer.name,
          subtitle: customer.address || customer.email || "No address on file",
          meta: `${customer._count.rentals} rental${customer._count.rentals === 1 ? "" : "s"}`,
        }))}
      />
    </div>
  );
}
