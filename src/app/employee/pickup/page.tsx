import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { PickupForm } from "@/components/PickupForm";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function PickupPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; rentalId?: string; error?: string }>;
}) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const { eventId, rentalId, error } = await searchParams;

  const assignedRentalIds =
    user.role === "EMPLOYEE"
      ? (
          await prisma.scheduleEvent.findMany({
            where: {
              employeeId: user.id,
              rentalId: { not: null },
              OR: [{ type: "PICKUP", completedAt: null }, { type: "DELIVERY" }],
            },
            select: { rentalId: true },
          })
        )
          .map((event) => event.rentalId)
          .filter((id): id is string => Boolean(id))
      : null;

  const rentals = await prisma.rental.findMany({
    where: {
      status: "ACTIVE",
      ...(assignedRentalIds ? { id: { in: assignedRentalIds } } : {}),
    },
    include: {
      equipment: true,
      customer: true,
      photos: { where: { type: "DELIVERY" }, include: photoInclude, orderBy: { takenAt: "asc" } },
    },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Pickup inspection"
        subtitle="Photograph the equipment after it returns. Pickup needs after photos, condition notes, a damage answer, and confirmation."
      />
      <ErrorBanner message={error} />
      <PickupForm
        rentals={rentals.map((rental) => ({
          id: rental.id,
          startAt: rental.startAt,
          destination: rental.destination,
          expectedPickupAt: rental.expectedPickupAt,
          rateSnapshot: rental.rateSnapshot,
          billingUnitSnapshot: rental.billingUnitSnapshot,
          equipment: rental.equipment,
          customer: rental.customer,
          beforePhotos: rental.photos,
        }))}
        eventId={eventId}
        initialRentalId={rentalId}
      />
    </div>
  );
}
