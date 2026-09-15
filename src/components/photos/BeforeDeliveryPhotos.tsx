import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { BEFORE_PHOTO_LABEL } from "@/lib/photo-labels";
import type { PhotoView } from "@/lib/photo-labels";

export function BeforeDeliveryPhotos({
  photos,
  empty = "No before-delivery photos yet.",
  showHeading = true,
}: {
  photos: PhotoView[];
  empty?: string;
  showHeading?: boolean;
}) {
  return (
    <div>
      {showHeading ? (
        <>
          <h3 className="mb-1 text-sm font-semibold">{BEFORE_PHOTO_LABEL}</h3>
          <p className="mb-3 text-sm text-stone-500">
            This is the condition of the equipment before the customer received it.
          </p>
        </>
      ) : null}
      <PhotoGallery photos={photos} empty={empty} />
    </div>
  );
}
