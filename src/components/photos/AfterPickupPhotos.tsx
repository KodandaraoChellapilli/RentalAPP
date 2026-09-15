import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { AFTER_PHOTO_LABEL } from "@/lib/photo-labels";
import type { PhotoView } from "@/lib/photo-labels";

export function AfterPickupPhotos({
  photos,
  empty = "No after-pickup photos yet.",
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
          <h3 className="mb-1 text-sm font-semibold">{AFTER_PHOTO_LABEL}</h3>
          <p className="mb-3 text-sm text-stone-500">
            This is the condition of the equipment when it came back.
          </p>
        </>
      ) : null}
      <PhotoGallery photos={photos} empty={empty} />
    </div>
  );
}
