import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveCharge } from "@/components/LiveCharge";
import { PageHeader } from "@/components/PageHeader";
import { EquipmentConditionHistory } from "@/components/photos/EquipmentConditionHistory";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRate } from "@/lib/billing";
import { signUploadPath } from "@/lib/photo-access";
import { photoInclude } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      rentals: {
        include: {
          customer: true,
          photos: { include: photoInclude, orderBy: { takenAt: "asc" } },
          events: { include: { employee: true }, orderBy: { startAt: "asc" } },
          invoice: true,
        },
        orderBy: { createdAt: "desc" },
      },
      photos: { include: photoInclude, orderBy: { takenAt: "desc" } },
      events: {
        include: { customer: true, employee: true },
        orderBy: { startAt: "desc" },
      },
    },
  });

  if (!equipment) notFound();

  const current = equipment.rentals.find((rental) => rental.status === "ACTIVE" || rental.status === "SCHEDULED");
  const cover = equipment.photos[0] ? await signUploadPath(equipment.photos[0].path) : null;

  return (
    <div>
      <PageHeader
        title={`#${equipment.number} ${equipment.name}`}
        subtitle={`${equipment.type} · ${formatRate(equipment.rate, equipment.billingUnit)}`}
        action={{ href: `/admin/equipment/${equipment.id}/edit`, label: "Edit" }}
      />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="card overflow-hidden p-0">
          {equipment.photos[0] && cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`#${equipment.number} ${equipment.name}`}
              className="h-56 w-full bg-stone-100 object-cover"
            />
          ) : null}
          <div className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-stone-600">{equipment.type}</p>
                <p className="text-sm text-stone-600">{formatRate(equipment.rate, equipment.billingUnit)}</p>
              </div>
              <StatusBadge status={equipment.status} />
            </div>
            {equipment.notes ? <p className="mt-3 text-sm text-stone-600">{equipment.notes}</p> : null}
            {current ? (
              <p className="mt-3 text-sm text-stone-700">
                Current customer: <span className="font-medium">{current.customer.name}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-stone-500">No current rental.</p>
            )}
          </div>
        </section>
        <section className="card p-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <dt className="text-stone-500">Rentals</dt>
              <dd className="font-semibold tabular-nums">{equipment.rentals.length}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Photos</dt>
              <dd className="font-semibold tabular-nums">{equipment.photos.length}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Deliveries</dt>
              <dd className="font-semibold tabular-nums">{equipment.events.filter((event) => event.type === "DELIVERY").length}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Pickups</dt>
              <dd className="font-semibold tabular-nums">{equipment.events.filter((event) => event.type === "PICKUP").length}</dd>
            </div>
          </dl>
        </section>
      </div>

      {current ? (
        <section className="card mb-5 p-4">
          <h2 className="font-semibold">Current rental</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p><span className="text-stone-500">Customer:</span> {current.customer.name}</p>
              <p><span className="text-stone-500">Destination:</span> {current.destination || "—"}</p>
              <p><span className="text-stone-500">Started:</span> {formatDateTime(current.startAt)}</p>
              <p><span className="text-stone-500">Expected pickup:</span> {formatDateTime(current.expectedPickupAt)}</p>
              <StatusBadge kind="rental" status={current.status} />
              {current.status === "ACTIVE" ? (
                <p className="pt-3">
                  <Link className="btn btn-primary" href={`/employee/pickup?rentalId=${current.id}`}>
                    Start pickup inspection
                  </Link>
                </p>
              ) : null}
            </div>
            <LiveCharge
              asOf={Date.now()}
              startAt={current.startAt}
              endAt={current.endAt}
              rate={current.rateSnapshot}
              unit={current.billingUnitSnapshot}
              status={current.status}
              finalAmount={current.finalAmount}
            />
          </div>
        </section>
      ) : null}

      <div className="mb-8">
        <EquipmentConditionHistory
          equipmentNumber={equipment.number}
          equipmentName={equipment.name}
          rentals={equipment.rentals}
        />
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Transports</h2>
        <div className="card divide-y divide-stone-100">
          {equipment.events.length === 0 ? (
            <p className="px-5 py-6 text-sm text-stone-500">No assignments yet.</p>
          ) : (
            equipment.events.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{event.title || event.type}</p>
                  <p className="text-stone-500">
                    {formatDateTime(event.startAt)}
                    {event.customer ? ` · ${event.customer.name}` : ""}
                    {event.employee ? ` · ${event.employee.name}` : ""}
                  </p>
                  {event.notes ? <p className="text-stone-500">Condition: {event.notes}</p> : null}
                </div>
                <span className={event.completedAt ? "text-emerald-700" : "text-amber-700"}>
                  {event.completedAt ? "Done" : "Open"}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <Link className="btn btn-primary" href={`/admin/schedule/new?equipmentId=${equipment.id}`}>
            Schedule delivery or pickup
          </Link>
        </div>
      </section>
    </div>
  );
}
