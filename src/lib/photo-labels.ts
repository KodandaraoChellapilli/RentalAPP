export const BEFORE_PHOTO_LABEL = "Before delivery / Initial condition";
export const AFTER_PHOTO_LABEL = "After pickup / Return condition";
export const PHOTO_AREAS = [
  "Front",
  "Back",
  "Left side",
  "Right side",
  "Attachments",
  "Engine / important areas",
  "Any damage",
];

export function photoLabelFor(type: string) {
  if (type === "PICKUP") return AFTER_PHOTO_LABEL;
  return BEFORE_PHOTO_LABEL;
}

export type PhotoView = {
  id: string;
  path: string;
  type: string;
  takenAt: Date | string;
  notes?: string | null;
  uploadedBy?: { name: string } | null;
  rental?: {
    id: string;
    customer?: { name: string } | null;
    equipment?: { number: string; name: string } | null;
  } | null;
  event?: { type: string; title: string | null } | null;
};
