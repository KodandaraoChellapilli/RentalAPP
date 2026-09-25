import type { Photo, Rental } from "../types";

export function conditionPhotos(rental: Pick<Rental, "photos" | "beforePhotos" | "afterPhotos">) {
  const all = rental.photos?.length
    ? rental.photos
    : [...(rental.beforePhotos || []), ...(rental.afterPhotos || [])];
  return {
    before: all.filter((photo) => photo.type === "DELIVERY"),
    after: all.filter((photo) => photo.type === "PICKUP"),
  };
}

export function photoUri(photo: Photo) {
  return photo.url || photo.path || "";
}
