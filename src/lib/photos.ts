import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export type PhotoType = "DELIVERY" | "PICKUP";

export { AFTER_PHOTO_LABEL, BEFORE_PHOTO_LABEL, PHOTO_AREAS, photoLabelFor } from "@/lib/photo-labels";
export type { PhotoView } from "@/lib/photo-labels";

export const photoInclude = {
  uploadedBy: true,
  rental: { include: { customer: true, equipment: true } },
  event: true,
} as const;

export async function savePhotos(opts: {
  files: File[];
  equipmentId: string;
  rentalId: string;
  uploadedById: string;
  type: PhotoType;
  eventId?: string | null;
  notes?: string | null;
  takenAt?: Date;
}) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const saved = [];
  for (const file of opts.files) {
    if (!file || file.size === 0) continue;
    if (file.type && !file.type.startsWith("image/")) continue;
    const ext = sanitizeExt(file.name, file.type);
    const filename = `${opts.type.toLowerCase()}-${opts.equipmentId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    const photo = await prisma.photo.create({
      data: {
        equipmentId: opts.equipmentId,
        rentalId: opts.rentalId,
        eventId: opts.eventId || null,
        uploadedById: opts.uploadedById,
        type: opts.type,
        path: `/uploads/${filename}`,
        notes: opts.notes || null,
        takenAt: opts.takenAt || new Date(),
      },
    });
    saved.push(photo);
  }
  return saved;
}

export function filesFromForm(formData: FormData, key = "photos") {
  return formData
    .getAll(key)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export async function linkExistingPhotosToEvents() {
  const photos = await prisma.photo.findMany({
    where: { eventId: null, rentalId: { not: null } },
  });
  for (const photo of photos) {
    const event = await prisma.scheduleEvent.findFirst({
      where: { rentalId: photo.rentalId, type: photo.type },
      orderBy: { startAt: "asc" },
    });
    if (!event) continue;
    await prisma.photo.update({
      where: { id: photo.id },
      data: { eventId: event.id },
    });
  }
}

function sanitizeExt(filename: string, mime: string) {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "svg"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}
