import { JobCard } from "@/components/cards/JobCard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { formatRate } from "@/lib/billing";
import { employeeJobHref, equipmentLabel } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const { done, error } = await searchParams;
  const jobs = await prisma.scheduleEvent.findMany({
    where: {
      employeeId: user.id,
      completedAt: null,
    },
    include: { equipment: true, customer: true, rental: true },
    orderBy: { startAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Transports" subtitle="Assigned deliveries and pickups. Completing a job updates the rental and equipment status." />
      <ErrorBanner message={error} />
      {done === "delivery" ? (
        <Alert variant="success" className="mb-4">
          Delivery recorded. Before-delivery photos are stored. The rental is now Active / On Rent.
        </Alert>
      ) : null}
      {done === "pickup" ? (
        <Alert variant="success" className="mb-4">
          Pickup recorded. After-pickup photos are stored and the final rental amount has been calculated.
        </Alert>
      ) : null}
      {jobs.length === 0 ? (
        <EmptyState title="No open transports" body="When the owner assigns you a delivery or pickup, it will show here." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              type={job.type}
              startAt={job.startAt}
              title={job.title}
              equipmentLabel={equipmentLabel(job.equipment, job.title)}
              customerName={job.customer?.name}
              destination={job.destination}
              rateLabel={job.rental ? formatRate(job.rental.rateSnapshot, job.rental.billingUnitSnapshot) : undefined}
              href={employeeJobHref(job.type, job.id, job.rentalId)}
              actionLabel={job.type === "PICKUP" ? "Open pickup" : "Open delivery"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
