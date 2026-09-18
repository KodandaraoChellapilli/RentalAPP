import { AfterPickupPhotos } from "@/components/photos/AfterPickupPhotos";
import { BeforeDeliveryPhotos } from "@/components/photos/BeforeDeliveryPhotos";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel } from "@/components/ui/Panel";
import { formatDuration, formatRate } from "@/lib/billing";
import type { PhotoView } from "@/lib/photo-labels";
import { formatDate, formatDateTime } from "@/lib/utils";

type HistoryEvent = {
  type: string;
  completedAt: Date | string | null;
  notes: string | null;
  employee?: { name: string } | null;
};

type HistoryRental = {
  id: string;
  status: string;
  startAt: Date | string | null;
  endAt: Date | string | null;
  destination: string | null;
  notes: string | null;
  rateSnapshot?: number;
  billingUnitSnapshot?: string;
  finalAmount?: number | null;
  customer: { name: string };
  photos: PhotoView[];
  events?: HistoryEvent[];
};

function firstEmployee(photos: PhotoView[], event?: HistoryEvent) {
  return event?.employee?.name || photos[0]?.uploadedBy?.name || "—";
}

function firstNotes(photos: PhotoView[], event?: HistoryEvent, fallback?: string | null) {
  return photos[0]?.notes || event?.notes || fallback || "No condition notes recorded.";
}

function damageStatus(notes: string | null | undefined) {
  if (!notes) return { label: "No damage reported", tone: "text-emerald-800 bg-emerald-50 border-emerald-200" };
  if (notes.includes("[Damage or issue reported]")) {
    return { label: "Damage or issue reported", tone: "text-amber-900 bg-amber-50 border-amber-200" };
  }
  return { label: "Condition noted", tone: "text-stone-700 bg-stone-50 border-stone-200" };
}

export function EquipmentConditionHistory({
  equipmentNumber,
  equipmentName,
  rentals,
}: {
  equipmentNumber: string;
  equipmentName: string;
  rentals: HistoryRental[];
}) {
  const allPhotos = rentals.flatMap((rental) => rental.photos);
  const beforeCount = allPhotos.filter((photo) => photo.type === "DELIVERY").length;
  const afterCount = allPhotos.filter((photo) => photo.type === "PICKUP").length;

  return (
    <section className="space-y-6">
      <Panel
        title="Rental history"
        subtitle={`#${equipmentNumber} ${equipmentName}. Each rental includes the customer, rate, employees, condition notes, and before/after photos.`}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-orange-800">Before delivery</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{beforeCount}</p>
            <p className="text-xs text-stone-600">Initial condition photos</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sky-800">After pickup</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{afterCount}</p>
            <p className="text-xs text-stone-600">Return condition photos</p>
          </div>
        </div>
      </Panel>

      {rentals.length === 0 ? (
        <div className="card px-6 py-10 text-center text-sm text-stone-500">
          No rental condition history yet. Completing a delivery with before photos starts this record.
        </div>
      ) : (
        rentals.map((rental) => {
          const before = rental.photos.filter((photo) => photo.type === "DELIVERY");
          const after = rental.photos.filter((photo) => photo.type === "PICKUP");
          const delivery = rental.events?.find((event) => event.type === "DELIVERY");
          const pickup = rental.events?.find((event) => event.type === "PICKUP");
          const afterNotes = firstNotes(after, pickup, rental.notes);
          const damage = damageStatus(afterNotes);

          return (
            <article key={rental.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">Rental history</p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-900">{rental.customer.name}</h3>
                  <p className="text-sm text-stone-500">
                    {formatDate(rental.startAt)} → {formatDate(rental.endAt)}
                    {rental.destination ? ` · ${rental.destination}` : ""}
                  </p>
                  {rental.rateSnapshot != null && rental.billingUnitSnapshot ? (
                    <p className="mt-1 text-sm text-stone-600">
                      Rate: {formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}
                      {rental.startAt
                        ? ` · Duration: ${formatDuration(
                            (rental.endAt ? new Date(rental.endAt).getTime() : new Date(rental.startAt).getTime()) -
                              new Date(rental.startAt).getTime(),
                          )}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <StatusBadge kind="rental" status={rental.status} />
              </div>
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="border-b border-stone-100 p-5 lg:border-b-0 lg:border-r">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-800">Initial condition</p>
                  <h4 className="mt-1 text-lg font-semibold text-stone-900">Before Delivery</h4>
                  <p className="mt-1 text-sm text-stone-600">This documents the equipment before the customer receives it.</p>
                  <div className="mt-3 space-y-1 text-sm text-stone-600">
                    <p>Date: {formatDateTime(rental.startAt || delivery?.completedAt)}</p>
                    <p>Delivered by: {firstEmployee(before, delivery)}</p>
                    <p>Customer: {rental.customer.name}</p>
                    <p>Condition notes: {firstNotes(before, delivery)}</p>
                  </div>
                  <div className="mt-4">
                    <BeforeDeliveryPhotos
                      photos={before}
                      showHeading={false}
                      empty="Before-delivery photos are required. None are attached to this rental yet."
                    />
                  </div>
                </div>
                <div className="bg-sky-50/40 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-800">Return condition</p>
                  <h4 className="mt-1 text-lg font-semibold text-stone-900">After Pickup</h4>
                  <p className="mt-1 text-sm text-stone-600">This documents the equipment after the customer returns it.</p>
                  <div className="mt-3 space-y-1 text-sm text-stone-600">
                    <p>Date: {formatDateTime(rental.endAt || pickup?.completedAt)}</p>
                    <p>Picked up by: {firstEmployee(after, pickup)}</p>
                    <p>Customer: {rental.customer.name}</p>
                    <p>Condition notes: {afterNotes}</p>
                    <p>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${damage.tone}`}>
                        {damage.label}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <AfterPickupPhotos
                      photos={after}
                      showHeading={false}
                      empty="After-pickup photos will appear when this rental is returned."
                    />
                  </div>
                </div>
              </div>
              {rental.rateSnapshot != null && rental.billingUnitSnapshot ? (
                <div className="border-t border-stone-100 px-5 py-4">
                  <LiveCharge
                    compact
                    asOf={Date.now()}
                    startAt={rental.startAt}
                    endAt={rental.endAt}
                    rate={rental.rateSnapshot}
                    unit={rental.billingUnitSnapshot}
                    status={rental.status}
                    finalAmount={rental.finalAmount}
                  />
                </div>
              ) : null}
            </article>
          );
        })
      )}
    </section>
  );
}
