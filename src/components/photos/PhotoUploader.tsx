"use client";

import { EquipmentPhotoUpload } from "@/components/photos/EquipmentPhotoUpload";

export function PhotoUploader({
  name = "photos",
  required = true,
}: {
  name?: string;
  label?: string;
  required?: boolean;
}) {
  return <EquipmentPhotoUpload name={name} mode="before" required={required} />;
}
