import { EquipmentConditionHistory } from "@/components/photos/EquipmentConditionHistory";
import { AFTER_PHOTO_LABEL, BEFORE_PHOTO_LABEL } from "@/lib/photo-labels";
import type { PhotoView } from "@/lib/photo-labels";

/** @deprecated Use EquipmentConditionHistory for owner equipment pages. */
export function EquipmentPhotoHistory({ photos }: { photos: PhotoView[] }) {
  const before = photos.filter((photo) => photo.type === "DELIVERY");
  const after = photos.filter((photo) => photo.type === "PICKUP");
  return (
    <p className="text-sm text-stone-500">
      {BEFORE_PHOTO_LABEL}: {before.length} · {AFTER_PHOTO_LABEL}: {after.length}
    </p>
  );
}

export { EquipmentConditionHistory };
