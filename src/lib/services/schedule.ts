import { prisma } from "@/lib/prisma";
import { notifyRentalEvent } from "@/lib/services/notifications";
import { ServiceError } from "@/lib/services/errors";
import { revalidateRentalSurfaces } from "@/lib/services/revalidate";
import type { SessionUser } from "@/lib/session-token";

export type ScheduleSource = "STAFF" | "CUSTOMER";

function combineDateAndTime(dateValue: string, timeValue: string) {
  const date = dateValue.trim();
  const time = timeValue.trim();
  if (!date || !time) return null;
  const startAt = new Date(`${date}T${time}`);
  return Number.isNaN(startAt.getTime()) ? null : startAt;
}

function equipmentLabel(equipment: { number: string; name: string }) {
  return `#${equipment.number} ${equipment.name}`;
}

function appendNote(existing: string | null | undefined, note: string) {
  const current = existing?.trim();
  if (!current) return note;
  if (current.includes(note)) return current;
  return `${current}\n${note}`;
}

function unknownFieldError(error: unknown) {
  return error instanceof Error && /Unknown argument/.test(error.message);
}

async function createScheduleEvent(data: {
  type: string;
  title: string;
  startAt: Date;
  equipmentId: string;
  customerId: string;
  employeeId?: string | null;
  rentalId?: string | null;
  notes?: string | null;
  destination?: string | null;
  source?: ScheduleSource;
}) {
  const { source, ...rest } = data;
  try {
    return await prisma.scheduleEvent.create({
      data: { ...rest, source: source || "STAFF" },
    });
  } catch (error) {
    if (!unknownFieldError(error)) throw error;
    const created = await prisma.scheduleEvent.create({ data: rest });
    if (source) {
      await prisma.$executeRaw`UPDATE ScheduleEvent SET source = ${source} WHERE id = ${created.id}`;
    }
    return created;
  }
}

async function markEventCustomerSource(id: string, notes: string | null, destination: string, startAt: Date) {
  try {
    return await prisma.scheduleEvent.update({
      where: { id },
      data: { startAt, destination, notes, source: "CUSTOMER" },
    });
  } catch (error) {
    if (!unknownFieldError(error)) throw error;
    const updated = await prisma.scheduleEvent.update({
      where: { id },
      data: { startAt, destination, notes },
    });
    await prisma.$executeRaw`UPDATE ScheduleEvent SET source = ${"CUSTOMER"} WHERE id = ${id}`;
    return updated;
  }
}

async function markDeliveryConfirmed(id: string, alreadyConfirmed?: Date | string | null) {
  const confirmedAt = alreadyConfirmed ? new Date(alreadyConfirmed) : new Date();
  try {
    return await prisma.scheduleEvent.update({
      where: { id },
      data: { customerConfirmedAt: confirmedAt },
    });
  } catch (error) {
    if (!unknownFieldError(error)) throw error;
    await prisma.$executeRaw`UPDATE ScheduleEvent SET customerConfirmedAt = ${confirmedAt.toISOString()} WHERE id = ${id}`;
    return { id, customerConfirmedAt: confirmedAt };
  }
}

export async function createScheduleService(opts: {
  type: string;
  equipmentId: string;
  customerId: string;
  employeeId?: string | null;
  startAt: Date;
  notes?: string | null;
  destination?: string | null;
  expectedPickupAt?: Date | null;
  rentalId?: string | null;
  source?: ScheduleSource;
}) {
  const type = opts.type || "DELIVERY";
  const notes = opts.notes?.trim() || null;
  const destination = opts.destination?.trim() || null;
  const employeeId = opts.employeeId || null;
  const source = opts.source || "STAFF";

  if (!opts.equipmentId || !opts.customerId || Number.isNaN(opts.startAt.getTime())) {
    throw new ServiceError("Equipment, customer, and date are required.");
  }

  const equipment = await prisma.equipment.findUnique({ where: { id: opts.equipmentId } });
  if (!equipment) throw new ServiceError("Equipment not found.", 404);

  const customer = await prisma.customer.findUnique({ where: { id: opts.customerId } });
  if (!customer) throw new ServiceError("Customer not found.", 404);

  let rentalId = opts.rentalId || null;

  if (type === "DELIVERY" || type === "RENTAL") {
    const existing = rentalId
      ? await prisma.rental.findUnique({ where: { id: rentalId } })
      : await prisma.rental.findFirst({
          where: { equipmentId: opts.equipmentId, status: { in: ["ACTIVE", "SCHEDULED"] } },
          orderBy: { createdAt: "desc" },
        });

    if (existing) {
      if (existing.customerId !== opts.customerId) {
        throw new ServiceError("That equipment already has an open rental with another customer.");
      }
      rentalId = existing.id;
      await prisma.rental.update({
        where: { id: existing.id },
        data: {
          destination: destination || existing.destination,
          expectedPickupAt: opts.expectedPickupAt || existing.expectedPickupAt,
          notes: notes || existing.notes,
        },
      });
    } else {
      const rental = await prisma.rental.create({
        data: {
          equipmentId: opts.equipmentId,
          customerId: opts.customerId,
          status: "SCHEDULED",
          destination,
          expectedPickupAt: opts.expectedPickupAt,
          rateSnapshot: equipment.rate,
          billingUnitSnapshot: equipment.billingUnit,
          notes,
        },
      });
      rentalId = rental.id;
    }
    if (equipment.status === "AVAILABLE") {
      await prisma.equipment.update({
        where: { id: opts.equipmentId },
        data: { status: "SCHEDULED" },
      });
    }
  }

  if (type === "PICKUP") {
    const active = rentalId
      ? await prisma.rental.findUnique({ where: { id: rentalId } })
      : await prisma.rental.findFirst({
          where: { equipmentId: opts.equipmentId, status: { in: ["ACTIVE", "SCHEDULED"] } },
          orderBy: { createdAt: "desc" },
        });
    if (!active) throw new ServiceError("No active rental found for pickup.");
    rentalId = active.id;
    await prisma.rental.update({
      where: { id: active.id },
      data: {
        expectedPickupAt: opts.expectedPickupAt || opts.startAt,
        destination: destination || active.destination,
      },
    });
    if (active.status === "ACTIVE") {
      await prisma.equipment.update({
        where: { id: opts.equipmentId },
        data: { status: "PICKUP_SCHEDULED" },
      });
    }
  }

  const event = await createScheduleEvent({
    type,
    title: `${type === "PICKUP" ? "Pick up" : "Deliver"} #${equipment.number}`,
    startAt: opts.startAt,
    equipmentId: opts.equipmentId,
    customerId: opts.customerId,
    employeeId,
    rentalId,
    notes,
    destination,
    source,
  });

  revalidateRentalSurfaces(opts.equipmentId, rentalId || undefined, opts.customerId);

  if (type === "DELIVERY") {
    await notifyRentalEvent({
      type: "DELIVERY_SCHEDULED",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      equipmentLabel: equipmentLabel(equipment),
      when: opts.startAt,
      location: destination,
    });
  } else if (type === "PICKUP") {
    await notifyRentalEvent({
      type: source === "CUSTOMER" ? "PICKUP_REQUESTED" : "PICKUP_SCHEDULED",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      equipmentLabel: equipmentLabel(equipment),
      when: opts.startAt,
      location: destination,
    });
  }

  return { eventId: event.id, rentalId, equipmentId: opts.equipmentId };
}

export async function requestCustomerPickupService(opts: {
  user: SessionUser;
  rentalId: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
}) {
  if (opts.user.role !== "CUSTOMER" && opts.user.role !== "ADMIN") {
    throw new ServiceError("You do not have access.", 403);
  }

  const location = opts.pickupLocation.trim();
  const startAt = combineDateAndTime(opts.pickupDate, opts.pickupTime);
  if (!startAt || !location) {
    throw new ServiceError("Pickup date, time, and location are required.");
  }

  const rental = await prisma.rental.findUnique({
    where: { id: opts.rentalId },
    include: { equipment: true, customer: true },
  });
  if (!rental) throw new ServiceError("Rental not found.", 404);
  if (opts.user.role === "CUSTOMER" && rental.customerId !== opts.user.customerId) {
    throw new ServiceError("Rental not found.", 404);
  }
  if (rental.status !== "ACTIVE") {
    throw new ServiceError("Only active rentals can be scheduled for pickup.");
  }

  const requestNote = `Customer requested pickup for ${opts.pickupDate} ${opts.pickupTime} at ${location}.`;
  const openPickup = await prisma.scheduleEvent.findFirst({
    where: { rentalId: rental.id, type: "PICKUP", completedAt: null },
    orderBy: { startAt: "asc" },
  });

  if (openPickup) {
    await markEventCustomerSource(openPickup.id, appendNote(openPickup.notes, requestNote), location, startAt);
  } else {
    await createScheduleEvent({
      type: "PICKUP",
      title: `Pick up #${rental.equipment.number}`,
      startAt,
      equipmentId: rental.equipmentId,
      customerId: rental.customerId,
      rentalId: rental.id,
      destination: location,
      notes: requestNote,
      source: "CUSTOMER",
    });
  }

  await prisma.rental.update({
    where: { id: rental.id },
    data: {
      expectedPickupAt: startAt,
      destination: location,
    },
  });

  if (rental.equipment.status === "ON_RENT") {
    await prisma.equipment.update({
      where: { id: rental.equipmentId },
      data: { status: "PICKUP_SCHEDULED" },
    });
  }

  revalidateRentalSurfaces(rental.equipmentId, rental.id, rental.customerId);

  await notifyRentalEvent({
    type: "PICKUP_REQUESTED",
    customerName: rental.customer.name,
    customerEmail: rental.customer.email,
    customerPhone: rental.customer.phone,
    equipmentLabel: equipmentLabel(rental.equipment),
    when: startAt,
    location,
  });

  const stillActive = await prisma.rental.findUnique({ where: { id: rental.id } });
  return {
    rentalId: rental.id,
    status: stillActive?.status || rental.status,
    expectedPickupAt: startAt.toISOString(),
    destination: location,
  };
}

export async function confirmCustomerDeliveryService(opts: { user: SessionUser; rentalId: string }) {
  if (opts.user.role !== "CUSTOMER" && opts.user.role !== "ADMIN") {
    throw new ServiceError("You do not have access.", 403);
  }

  const rental = await prisma.rental.findUnique({
    where: { id: opts.rentalId },
    include: { equipment: true, customer: true },
  });
  if (!rental) throw new ServiceError("Rental not found.", 404);
  if (opts.user.role === "CUSTOMER" && rental.customerId !== opts.user.customerId) {
    throw new ServiceError("Rental not found.", 404);
  }
  if (rental.status === "COMPLETED" || rental.status === "CANCELLED") {
    throw new ServiceError("This rental is already closed.");
  }

  const delivery = await prisma.scheduleEvent.findFirst({
    where: { rentalId: rental.id, type: "DELIVERY" },
    orderBy: { startAt: "asc" },
  });
  if (!delivery) throw new ServiceError("No scheduled delivery was found for this rental.");

  const confirmed = await markDeliveryConfirmed(delivery.id, delivery.customerConfirmedAt);

  revalidateRentalSurfaces(rental.equipmentId, rental.id, rental.customerId);

  await notifyRentalEvent({
    type: "DELIVERY_CONFIRMED",
    customerName: rental.customer.name,
    customerEmail: rental.customer.email,
    customerPhone: rental.customer.phone,
    equipmentLabel: equipmentLabel(rental.equipment),
    when: delivery.startAt,
    location: delivery.destination || rental.destination,
  });

  const stillOpen = await prisma.rental.findUnique({ where: { id: rental.id } });
  return {
    rentalId: rental.id,
    status: stillOpen?.status || rental.status,
    customerConfirmedAt: confirmed.customerConfirmedAt,
  };
}
