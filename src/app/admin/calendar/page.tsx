import { CalendarMonth } from "@/components/CalendarMonth";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [events, employees] = await Promise.all([
    prisma.scheduleEvent.findMany({
      include: {
        equipment: true,
        customer: true,
        employee: true,
        rental: true,
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Click an event to see equipment, customer, employee, and rental details."
        action={{ href: "/admin/schedule/new", label: "New schedule" }}
      />
      <ErrorBanner message={error} />
      <CalendarMonth events={events} employees={employees} />
    </div>
  );
}
