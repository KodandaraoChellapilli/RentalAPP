"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { calculateCharge } from "@/lib/billing";
import { filesFromForm, savePhotos } from "@/lib/photos";
import type { BillingUnit } from "@/lib/constants";

function inspectionPhotos(formData: FormData) {
  return filesFromForm(formData).filter((file) => file.type.startsWith("image/"));
}

function requireConditionNotes(formData: FormData, failTo: string) {
  const notes = String(formData.get("notes") || "").trim();
  if (notes.length < 3) {
    redirect(`${failTo}?error=Condition+notes+are+required`);
  }
  return notes;
}

function requireConditionConfirm(formData: FormData, failTo: string) {
  if (String(formData.get("conditionConfirmed") || "") !== "on") {
    redirect(`${failTo}?error=Confirm+the+equipment+condition+before+continuing`);
  }
}

function pickupEquipmentStatus(formData: FormData) {
  const hasIssueRaw = String(formData.get("hasIssue") || "");
  if (hasIssueRaw !== "yes" && hasIssueRaw !== "no") {
    redirect("/employee/pickup?error=Report+whether+there+is+damage+or+an+issue");
  }
  const hasIssue = hasIssueRaw === "yes";
  const afterStatusRaw = String(formData.get("afterStatus") || "");
  if (hasIssue) {
    return {
      hasIssue,
      afterStatus: afterStatusRaw === "OUT_OF_SERVICE" ? "OUT_OF_SERVICE" : "MAINTENANCE",
    } as const;
  }
  return {
    hasIssue,
    afterStatus:
      afterStatusRaw === "MAINTENANCE" || afterStatusRaw === "OUT_OF_SERVICE" ? afterStatusRaw : "AVAILABLE",
  } as const;
}

function revalidateRentalSurfaces(equipmentId?: string, rentalId?: string, customerId?: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/rentals");
  revalidatePath("/admin/deliveries");
  revalidatePath("/admin/pickups");
  revalidatePath("/admin/reports");
  revalidatePath("/employee/jobs");
  revalidatePath("/employee/deliver");
  revalidatePath("/employee/pickup");
  revalidatePath("/employee/equipment");
  revalidatePath("/customer/rentals");
  if (equipmentId) revalidatePath(`/admin/equipment/${equipmentId}`);
  if (rentalId) revalidatePath(`/customer/rentals/${rentalId}`);
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
}

export async function createSchedule(formData: FormData) {
  await requireUser(["ADMIN"]);
  const type = String(formData.get("type") || "DELIVERY");
  const equipmentId = String(formData.get("equipmentId") || "");
  const customerId = String(formData.get("customerId") || "");
  const employeeId = String(formData.get("employeeId") || "") || null;
  const startAt = new Date(String(formData.get("startAt") || ""));
  const notes = String(formData.get("notes") || "").trim() || null;
  const destination = String(formData.get("destination") || "").trim() || null;
  const expectedPickupAtRaw = String(formData.get("expectedPickupAt") || "");
  const expectedPickupAt = expectedPickupAtRaw ? new Date(expectedPickupAtRaw) : null;

  if (!equipmentId || !customerId || Number.isNaN(startAt.getTime())) {
    redirect("/admin/schedule/new?error=Equipment,+customer,+and+date+are+required");
  }

  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) redirect("/admin/schedule/new?error=Equipment+not+found");

  let rentalId = String(formData.get("rentalId") || "") || null;

  if (type === "DELIVERY" || type === "RENTAL") {
    const existing =
      rentalId
        ? await prisma.rental.findUnique({ where: { id: rentalId } })
        : await prisma.rental.findFirst({
            where: { equipmentId, status: { in: ["ACTIVE", "SCHEDULED"] } },
            orderBy: { createdAt: "desc" },
          });

    if (existing) {
      if (existing.customerId !== customerId) {
        redirect("/admin/schedule/new?error=That+equipment+already+has+an+open+rental+with+another+customer");
      }
      rentalId = existing.id;
      await prisma.rental.update({
        where: { id: existing.id },
        data: {
          destination: destination || existing.destination,
          expectedPickupAt: expectedPickupAt || existing.expectedPickupAt,
          notes: notes || existing.notes,
        },
      });
    } else {
      const rental = await prisma.rental.create({
        data: {
          equipmentId,
          customerId,
          status: "SCHEDULED",
          destination,
          expectedPickupAt,
          rateSnapshot: equipment.rate,
          billingUnitSnapshot: equipment.billingUnit,
          notes,
        },
      });
      rentalId = rental.id;
    }
    if (equipment.status === "AVAILABLE") {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: { status: "SCHEDULED" },
      });
    }
  }

  if (type === "PICKUP") {
    const active =
      rentalId
        ? await prisma.rental.findUnique({ where: { id: rentalId } })
        : await prisma.rental.findFirst({
            where: { equipmentId, status: { in: ["ACTIVE", "SCHEDULED"] } },
            orderBy: { createdAt: "desc" },
          });
    if (!active) {
      redirect("/admin/schedule/new?error=No+active+rental+found+for+pickup");
    }
    rentalId = active.id;
    await prisma.rental.update({
      where: { id: active.id },
      data: {
        expectedPickupAt: expectedPickupAt || startAt,
        destination: destination || active.destination,
      },
    });
    if (active.status === "ACTIVE") {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: { status: "PICKUP_SCHEDULED" },
      });
    }
  }

  await prisma.scheduleEvent.create({
    data: {
      type,
      title: `${type === "PICKUP" ? "Pick up" : "Deliver"} #${equipment.number}`,
      startAt,
      equipmentId,
      customerId,
      employeeId,
      rentalId,
      notes,
      destination,
    },
  });

  revalidateRentalSurfaces(equipmentId, rentalId || undefined, customerId);
  redirect("/admin/calendar");
}

export async function completeDelivery(formData: FormData) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const eventId = String(formData.get("eventId") || "") || null;
  const rentalId = String(formData.get("rentalId") || "") || null;
  const equipmentId = String(formData.get("equipmentId") || "");
  const customerId = String(formData.get("customerId") || "");
  const destination = String(formData.get("destination") || "").trim();
  const notes = requireConditionNotes(formData, "/employee/deliver");
  requireConditionConfirm(formData, "/employee/deliver");
  const photos = inspectionPhotos(formData);

  if (!equipmentId || !customerId || !destination) {
    redirect("/employee/deliver?error=Equipment,+customer,+and+destination+are+required");
  }
  if (photos.length === 0) {
    redirect("/employee/deliver?error=At+least+one+before-delivery+photo+is+required");
  }

  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) redirect("/employee/deliver?error=Equipment+not+found");

  const now = new Date();
  let rental = rentalId ? await prisma.rental.findUnique({ where: { id: rentalId } }) : null;

  if (!rental && eventId) {
    const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId } });
    if (event?.rentalId) {
      rental = await prisma.rental.findUnique({ where: { id: event.rentalId } });
    }
  }

  if (!rental) {
    rental = await prisma.rental.create({
      data: {
        equipmentId,
        customerId,
        status: "ACTIVE",
        destination,
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
        destination,
        startAt: now,
        notes,
        customerId,
      },
    });
  }

  const event = await completeOrCreateEvent({
    eventId,
    type: "DELIVERY",
    title: `Deliver #${equipment.number}`,
    now,
    equipmentId,
    customerId,
    employeeId: user.id,
    rentalId: rental.id,
    destination,
    notes,
  });

  const saved = await savePhotos({
    files: photos,
    equipmentId,
    rentalId: rental.id,
    uploadedById: user.id,
    type: "DELIVERY",
    eventId: event.id,
    notes,
    takenAt: now,
  });
  if (saved.length === 0) {
    redirect("/employee/deliver?error=Upload+at+least+one+before-delivery+photo");
  }

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: { status: "ON_RENT" },
  });

  revalidateRentalSurfaces(equipmentId, rental.id, customerId);
  redirect(user.role === "ADMIN" ? `/admin/equipment/${equipmentId}` : "/employee/jobs?done=delivery");
}

export async function completePickup(formData: FormData) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const eventId = String(formData.get("eventId") || "") || null;
  const rentalId = String(formData.get("rentalId") || "");
  const notes = requireConditionNotes(formData, "/employee/pickup");
  requireConditionConfirm(formData, "/employee/pickup");
  const { hasIssue, afterStatus } = pickupEquipmentStatus(formData);
  const photos = inspectionPhotos(formData);
  const recordedNotes = hasIssue ? `[Damage or issue reported] ${notes}` : notes;

  if (!rentalId) redirect("/employee/pickup?error=Select+a+rental+to+pick+up");
  if (photos.length === 0) {
    redirect("/employee/pickup?error=At+least+one+after-pickup+photo+is+required");
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { equipment: true },
  });
  if (!rental || !rental.startAt) {
    redirect("/employee/pickup?error=Rental+is+not+active");
  }

  const now = new Date();
  const charge = calculateCharge(
    rental.startAt,
    now,
    rental.rateSnapshot,
    rental.billingUnitSnapshot as BillingUnit,
  );

  const event = await completeOrCreateEvent({
    eventId,
    type: "PICKUP",
    title: `Pick up #${rental.equipment.number}`,
    now,
    equipmentId: rental.equipmentId,
    customerId: rental.customerId,
    employeeId: user.id,
    rentalId: rental.id,
    notes: recordedNotes,
  });

  const saved = await savePhotos({
    files: photos,
    equipmentId: rental.equipmentId,
    rentalId: rental.id,
    uploadedById: user.id,
    type: "PICKUP",
    eventId: event.id,
    notes: recordedNotes,
    takenAt: now,
  });
  if (saved.length === 0) {
    redirect("/employee/pickup?error=Upload+at+least+one+after-pickup+photo");
  }

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
  redirect(user.role === "ADMIN" ? `/admin/equipment/${rental.equipmentId}` : "/employee/jobs?done=pickup");
}

export async function assignScheduleEmployee(formData: FormData) {
  await requireUser(["ADMIN"]);
  const eventId = String(formData.get("eventId") || "");
  const employeeId = String(formData.get("employeeId") || "") || null;
  if (!eventId) redirect("/admin/calendar?error=Select+a+scheduled+job");

  await prisma.scheduleEvent.update({
    where: { id: eventId },
    data: { employeeId },
  });

  const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId } });
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee/jobs");
  if (event?.equipmentId) revalidatePath(`/admin/equipment/${event.equipmentId}`);
  if (event?.employeeId) revalidatePath(`/admin/employees/${event.employeeId}`);
  redirect("/admin/calendar");
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
