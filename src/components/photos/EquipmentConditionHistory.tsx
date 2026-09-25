import { AfterPickupPhotos } from "@/components/photos/AfterPickupPhotos";
import { BeforeDeliveryPhotos } from "@/components/photos/BeforeDeliveryPhotos";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDuration, formatMoney, formatRate } from "@/lib/billing";
import type { PhotoView } from "@/lib/photo-labels";
import Link from "next/link";
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
  invoice?: { id: string; number: string; status: string; total: number; dueDate: Date | string } | null;
};

function firstEmployee(photos: PhotoView[], event?: HistoryEvent) {
  return event?.employee?.name || photos[0]?.uploadedBy?.name || "—";
}

function firstNotes(photos: PhotoView[], event?: HistoryEvent, fallback?: string | null) {
  return photos[0]?.notes || event?.notes || fallback || "None";
}

function damageLabel(notes: string | null | undefined) {
  if (!notes) return "No damage reported";
  if (notes.includes("[Damage or issue reported]")) return "Damage or issue reported";
  return "Condition noted";
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
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-semibold text-stone-900">Rental history</h2>
        <p className="mt-0.5 text-sm text-stone-500">
          {equipmentNumber ? `#${equipmentNumber} ` : ""}
          {equipmentName}
        </p>
      </div>

      {rentals.length === 0 ? (
        <div className="card px-4 py-8 text-center text-sm text-stone-500">
          No rental history yet. Completing a delivery with before photos starts this record.
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => {
            const before = rental.photos.filter((photo) => photo.type === "DELIVERY");
            const after = rental.photos.filter((photo) => photo.type === "PICKUP");
            const delivery = rental.events?.find((event) => event.type === "DELIVERY");
            const pickup = rental.events?.find((event) => event.type === "PICKUP");
            const afterNotes = firstNotes(after, pickup, rental.notes);
            const durationMs =
              rental.startAt
                ? (rental.endAt ? new Date(rental.endAt).getTime() : new Date(rental.startAt).getTime()) -
                  new Date(rental.startAt).getTime()
                : 0;

            return (
              <article key={rental.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-stone-900">{rental.customer.name}</h3>
                    <p className="text-sm text-stone-500">
                      {formatDate(rental.startAt)} → {formatDate(rental.endAt)}
                      {durationMs ? ` · ${formatDuration(durationMs)}` : ""}
                      {rental.rateSnapshot != null && rental.billingUnitSnapshot
                        ? ` · ${formatRate(rental.rateSnapshot, rental.billingUnitSnapshot)}`
                        : ""}
                    </p>
                    {rental.destination ? <p className="truncate text-sm text-stone-500">{rental.destination}</p> : null}
                  </div>
                  <div className="text-right">
                    <StatusBadge kind="rental" status={rental.status} />
                    {rental.rateSnapshot != null && rental.billingUnitSnapshot ? (
                      <p className="mt-1">
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
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="border-b border-stone-200/80 p-4 lg:border-b-0 lg:border-r">
                    <p className="text-sm font-semibold text-stone-900">Delivery</p>
                    <dl className="mt-2 space-y-1 text-sm text-stone-600">
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">When</dt>
                        <dd>{formatDateTime(rental.startAt || delivery?.completedAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">Employee</dt>
                        <dd className="truncate">{firstEmployee(before, delivery)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">Notes</dt>
                        <dd className="max-w-[70%] text-right">{firstNotes(before, delivery)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <BeforeDeliveryPhotos
                        photos={before}
                        showHeading={false}
                        empty="No before photos yet."
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-stone-900">Pickup</p>
                    <dl className="mt-2 space-y-1 text-sm text-stone-600">
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">When</dt>
                        <dd>{formatDateTime(rental.endAt || pickup?.completedAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">Employee</dt>
                        <dd className="truncate">{firstEmployee(after, pickup)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">Damage</dt>
                        <dd>{damageLabel(afterNotes)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-stone-500">Notes</dt>
                        <dd className="max-w-[70%] text-right">{afterNotes}</dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <AfterPickupPhotos
                        photos={after}
                        showHeading={false}
                        empty="After photos appear when pickup is completed."
                      />
                    </div>
                  </div>
                </div>
                {rental.invoice ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-4 py-3 text-sm">
                    <Link href={`/admin/invoices/${rental.invoice.id}`} className="font-medium">
                      {rental.invoice.number}
                    </Link>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums">{formatMoney(rental.invoice.total)}</span>
                      <span className="text-stone-500">Due {formatDate(rental.invoice.dueDate)}</span>
                      <StatusBadge kind="invoice" status={rental.invoice.status} />
                    </span>
                  </div>
                ) : (
                  <div className="border-t border-stone-200/80 px-4 py-3 text-sm">
                    <Link href={`/admin/invoices/new?rentalId=${rental.id}`} className="font-medium text-orange-800">
                      Create invoice
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
