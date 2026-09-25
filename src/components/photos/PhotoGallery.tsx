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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
    <figure className="overflow-hidden rounded border border-stone-200 bg-white">
      <a href={photo.path} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.path} alt={`${eventLabel} documentation`} className="h-48 w-full bg-stone-100 object-cover" />
      </a>
      <figcaption className="space-y-0.5 px-3 py-2.5 text-sm text-stone-600">
        <p className="font-medium text-stone-800">{eventLabel}</p>
        <p>{formatDateTime(photo.takenAt)}</p>
        {photo.uploadedBy ? <p>{photo.uploadedBy.name}</p> : null}
        {customerName ? <p>{customerName}</p> : null}
        {rentalLabel ? <p className="text-stone-500">{rentalLabel}</p> : null}
        {photo.notes ? <p className="text-stone-700">{photo.notes}</p> : null}
      </figcaption>
    </figure>
  );
}

export { PhotoGallery as EquipmentPhotoGallery };
