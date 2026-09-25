import { assertCanAccessEvent } from "@/lib/api/access";
import { calculateCharge } from "@/lib/billing";
import type { BillingUnit } from "@/lib/constants";
import { isAllowedPhotoFile } from "@/lib/photo-files";
import { prisma } from "@/lib/prisma";
import { savePhotos } from "@/lib/photos";
import { notifyRentalEvent } from "@/lib/services/notifications";
import { ServiceError } from "@/lib/services/errors";
import { revalidateRentalSurfaces } from "@/lib/services/revalidate";
import type { SessionUser } from "@/lib/session-token";

export async function completeDeliveryService(opts: {
  user: SessionUser;
  eventId?: string | null;
  rentalId?: string | null;
  equipmentId: string;
  customerId: string;
  destination: string;
  notes: string;
  conditionConfirmed: boolean;
  photos: File[];
}) {
  const notes = opts.notes.trim();
  if (!opts.equipmentId || !opts.customerId || !opts.destination.trim()) {
    throw new ServiceError("Equipment, customer, and destination are required.");
  }
  if (notes.length < 3) throw new ServiceError("Condition notes are required.");
  if (!opts.conditionConfirmed) throw new ServiceError("Confirm the equipment condition before continuing.");
  const photos = opts.photos.filter((file) => isAllowedPhotoFile(file));
  if (photos.length === 0) throw new ServiceError("At least one before-delivery photo is required.");

  const equipment = await prisma.equipment.findUnique({ where: { id: opts.equipmentId } });
  if (!equipment) throw new ServiceError("Equipment not found.", 404);
  if (equipment.status === "MAINTENANCE" || equipment.status === "OUT_OF_SERVICE") {
    throw new ServiceError("This machine is not available for delivery.");
  }

  const now = new Date();
  let rental = opts.rentalId ? await prisma.rental.findUnique({ where: { id: opts.rentalId } }) : null;

  if (!rental && opts.eventId) {
    const event = await prisma.scheduleEvent.findUnique({ where: { id: opts.eventId } });
    if (event?.rentalId) {
      rental = await prisma.rental.findUnique({ where: { id: event.rentalId } });
    }
  }

  if (rental && (rental.status === "ACTIVE" || rental.status === "COMPLETED" || rental.status === "CANCELLED")) {
    throw new ServiceError("This rental is already delivered or closed.");
  }

  const alreadyOnRent = await prisma.rental.findFirst({
    where: { equipmentId: opts.equipmentId, status: "ACTIVE" },
  });
  if (alreadyOnRent) throw new ServiceError("This machine is already on rent.");

  if (opts.eventId) {
    const event = await prisma.scheduleEvent.findUnique({ where: { id: opts.eventId } });
    if (event) assertCanAccessEvent(opts.user, event.employeeId);
  }

  if (!rental) {
    rental = await prisma.rental.create({
      data: {
        equipmentId: opts.equipmentId,
        customerId: opts.customerId,
        status: "ACTIVE",
        destination: opts.destination.trim(),
        startAt: now,
        rateSnapshot: equipment.rate,
        billingUnitSnapshot: equipment.billingUnit,
        notes,
      },
    });
  } else {
    rental = await prisma.rental.update({
      where: { id: rental.id },
      data: {
        status: "ACTIVE",
        destination: opts.destination.trim(),
        startAt: now,
        notes,
        customerId: opts.customerId,
      },
    });
  }

  const event = await completeOrCreateEvent({
    eventId: opts.eventId || null,
    type: "DELIVERY",
    title: `Deliver #${equipment.number}`,
    now,
    equipmentId: opts.equipmentId,
    customerId: opts.customerId,
    employeeId: opts.user.id,
    rentalId: rental.id,
    destination: opts.destination.trim(),
    notes,
  });

  const saved = await savePhotos({
    files: photos,
    equipmentId: opts.equipmentId,
    rentalId: rental.id,
    uploadedById: opts.user.id,
    type: "DELIVERY",
    eventId: event.id,
    notes,
    takenAt: now,
  });
  if (saved.length === 0) throw new ServiceError("Upload at least one before-delivery photo.");

  await prisma.equipment.update({
    where: { id: opts.equipmentId },
    data: { status: "ON_RENT" },
  });

  revalidateRentalSurfaces(opts.equipmentId, rental.id, opts.customerId);

  const customer = await prisma.customer.findUnique({ where: { id: opts.customerId } });
  await notifyRentalEvent({
    type: "EQUIPMENT_DELIVERED",
    customerName: customer?.name,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    equipmentLabel: `#${equipment.number} ${equipment.name}`,
    location: opts.destination.trim(),
    when: now,
  });

  return { rentalId: rental.id, equipmentId: opts.equipmentId, photoCount: saved.length };
}

export async function completePickupService(opts: {
  user: SessionUser;
  eventId?: string | null;
  rentalId: string;
  notes: string;
  conditionConfirmed: boolean;
  hasIssue: "yes" | "no";
  afterStatus?: string;
  photos: File[];
}) {
  const notes = opts.notes.trim();
  if (!opts.rentalId) throw new ServiceError("Select a rental to pick up.");
  if (notes.length < 3) throw new ServiceError("Condition notes are required.");
  if (!opts.conditionConfirmed) throw new ServiceError("Confirm the equipment condition before continuing.");
  if (opts.hasIssue !== "yes" && opts.hasIssue !== "no") {
    throw new ServiceError("Report whether there is damage or an issue.");
  }
  const photos = opts.photos.filter((file) => isAllowedPhotoFile(file));
  if (photos.length === 0) throw new ServiceError("At least one after-pickup photo is required.");

  const hasIssue = opts.hasIssue === "yes";
  const afterStatusRaw = opts.afterStatus || "";
  const afterStatus = hasIssue
    ? afterStatusRaw === "OUT_OF_SERVICE"
      ? "OUT_OF_SERVICE"
      : "MAINTENANCE"
    : afterStatusRaw === "MAINTENANCE" || afterStatusRaw === "OUT_OF_SERVICE"
      ? afterStatusRaw
      : "AVAILABLE";
  const recordedNotes = hasIssue ? `[Damage or issue reported] ${notes}` : notes;

  const rental = await prisma.rental.findUnique({
    where: { id: opts.rentalId },
    include: { equipment: true },
  });
  if (!rental || !rental.startAt) throw new ServiceError("Rental is not active.", 404);
  if (rental.status !== "ACTIVE") throw new ServiceError("Only active rentals can be picked up.");

  await assertStaffCanWorkRental(opts.user, rental.id, opts.eventId || null, "PICKUP");

  const now = new Date();
  const charge = calculateCharge(
    rental.startAt,
    now,
    rental.rateSnapshot,
    rental.billingUnitSnapshot as BillingUnit,
  );

  const event = await completeOrCreateEvent({
    eventId: opts.eventId || null,
    type: "PICKUP",
    title: `Pick up #${rental.equipment.number}`,
    now,
    equipmentId: rental.equipmentId,
    customerId: rental.customerId,
    employeeId: opts.user.id,
    rentalId: rental.id,
    notes: recordedNotes,
  });

  const saved = await savePhotos({
    files: photos,
    equipmentId: rental.equipmentId,
    rentalId: rental.id,
    uploadedById: opts.user.id,
    type: "PICKUP",
    eventId: event.id,
    notes: recordedNotes,
    takenAt: now,
  });
  if (saved.length === 0) throw new ServiceError("Upload at least one after-pickup photo.");

  await prisma.rental.update({
    where: { id: rental.id },
    data: {
      status: "COMPLETED",
      endAt: now,
      finalAmount: charge.amount,
      notes: recordedNotes,
    },
  });

  await prisma.equipment.update({
    where: { id: rental.equipmentId },
    data: { status: afterStatus },
  });

  revalidateRentalSurfaces(rental.equipmentId, rental.id, rental.customerId);

  const customer = await prisma.customer.findUnique({ where: { id: rental.customerId } });
  await notifyRentalEvent({
    type: "EQUIPMENT_PICKED_UP",
    customerName: customer?.name,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    equipmentLabel: `#${rental.equipment.number} ${rental.equipment.name}`,
    location: rental.destination,
    when: now,
  });

  return {
    rentalId: rental.id,
    equipmentId: rental.equipmentId,
    finalAmount: charge.amount,
    afterStatus,
    photoCount: saved.length,
  };
}

/** Employees may only work rentals tied to their assigned schedule events. */
export async function assertStaffCanWorkRental(
  user: SessionUser,
  rentalId: string,
  eventId: string | null,
  type: "DELIVERY" | "PICKUP",
) {
  if (user.role === "ADMIN" || user.role === "MANAGER") return;

  if (eventId) {
    const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId } });
    if (!event || event.type !== type) {
      throw new ServiceError(`${type === "PICKUP" ? "Pickup" : "Delivery"} not found.`, 404);
    }
    assertCanAccessEvent(user, event.employeeId);
    return;
  }

  const assigned = await prisma.scheduleEvent.findFirst({
    where: {
      rentalId,
      employeeId: user.id,
      OR: [{ type, completedAt: null }, { type: "DELIVERY" }],
    },
  });
  if (assigned) return;

  const openJob = await prisma.scheduleEvent.findFirst({
    where: { rentalId, type, completedAt: null },
  });
  if (openJob) {
    assertCanAccessEvent(user, openJob.employeeId);
    return;
  }

  throw new ServiceError("You do not have access.", 403);
}

async function completeOrCreateEvent(opts: {
  eventId: string | null;
  type: "DELIVERY" | "PICKUP";
  title: string;
  now: Date;
  equipmentId: string;
  customerId: string;
  employeeId: string;
  rentalId: string;
  destination?: string | null;
  notes?: string | null;
}) {
  const matching = opts.eventId
    ? await prisma.scheduleEvent.findUnique({ where: { id: opts.eventId } })
    : await prisma.scheduleEvent.findFirst({
        where: {
          type: opts.type,
          completedAt: null,
          equipmentId: opts.equipmentId,
          OR: [{ rentalId: opts.rentalId }, { rentalId: null }],
        },
        orderBy: { startAt: "asc" },
      });

  if (matching) {
    return prisma.scheduleEvent.update({
      where: { id: matching.id },
      data: {
        completedAt: opts.now,
        rentalId: opts.rentalId,
        destination: opts.destination || matching.destination,
        employeeId: matching.employeeId || opts.employeeId,
        notes: opts.notes || matching.notes,
      },
    });
  }

  return prisma.scheduleEvent.create({
    data: {
      type: opts.type,
      title: opts.title,
      startAt: opts.now,
      completedAt: opts.now,
      equipmentId: opts.equipmentId,
      customerId: opts.customerId,
      employeeId: opts.employeeId,
      rentalId: opts.rentalId,
      destination: opts.destination,
      notes: opts.notes,
    },
  });
}
