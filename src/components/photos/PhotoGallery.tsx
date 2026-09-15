import { photoLabelFor } from "@/lib/photo-labels";
import type { PhotoView } from "@/lib/photo-labels";
import { formatDateTime } from "@/lib/utils";

export function PhotoGallery({
  photos,
  empty = "No photos yet.",
}: {
  photos: PhotoView[];
  empty?: string;
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-stone-500">{empty}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}

export function PhotoCard({ photo }: { photo: PhotoView }) {
  const eventLabel = photoLabelFor(photo.type);
  const rentalLabel = photo.rental?.equipment
    ? `#${photo.rental.equipment.number} ${photo.rental.equipment.name}`
    : photo.event?.title;
  const customerName = photo.rental?.customer?.name;

  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.path} alt={`${eventLabel} documentation`} className="h-52 w-full bg-stone-100 object-cover" />
      <figcaption className="space-y-1 px-4 py-3 text-sm text-stone-600">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">{eventLabel}</p>
        <p className="font-medium text-stone-800">{formatDateTime(photo.takenAt)}</p>
        {photo.uploadedBy ? <p>Employee: {photo.uploadedBy.name}</p> : null}
        {customerName ? <p>Rental: {customerName}</p> : null}
        {rentalLabel ? <p className="text-stone-500">{rentalLabel}</p> : null}
        {photo.notes ? <p className="text-stone-700">Condition: {photo.notes}</p> : null}
      </figcaption>
    </figure>
  );
}

export { PhotoGallery as EquipmentPhotoGallery };
