import { AfterPickupPhotos } from "@/components/photos/AfterPickupPhotos";
import { BeforeDeliveryPhotos } from "@/components/photos/BeforeDeliveryPhotos";
import { Panel } from "@/components/ui/Panel";
import { AFTER_PHOTO_LABEL, BEFORE_PHOTO_LABEL } from "@/lib/photo-labels";
import type { PhotoView } from "@/lib/photo-labels";

export function BeforeAfterPhotos({
  photos,
  beforeEmpty,
  afterEmpty,
  plain = false,
}: {
  photos: PhotoView[];
  beforeEmpty?: string;
  afterEmpty?: string;
  plain?: boolean;
}) {
  const before = photos.filter((photo) => photo.type === "DELIVERY");
  const after = photos.filter((photo) => photo.type === "PICKUP");

  if (plain) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <BeforeDeliveryPhotos photos={before} empty={beforeEmpty} />
        <AfterPickupPhotos photos={after} empty={afterEmpty} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title={BEFORE_PHOTO_LABEL} subtitle="Condition when the machine left the yard.">
        <BeforeDeliveryPhotos photos={before} empty={beforeEmpty} showHeading={false} />
      </Panel>
      <Panel title={AFTER_PHOTO_LABEL} subtitle="Condition when the machine was returned.">
        <AfterPickupPhotos photos={after} empty={afterEmpty} showHeading={false} />
      </Panel>
    </div>
  );
}
