"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { filesFromForm } from "@/lib/photos";
import { ServiceError } from "@/lib/services/errors";
import { completeDeliveryService, completePickupService } from "@/lib/services/rentals";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { revalidateRentalSurfaces } from "@/lib/services/revalidate";

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
  try {
    const result = await completeDeliveryService({
      user,
      eventId: String(formData.get("eventId") || "") || null,
      rentalId: String(formData.get("rentalId") || "") || null,
      equipmentId: String(formData.get("equipmentId") || ""),
      customerId: String(formData.get("customerId") || ""),
      destination: String(formData.get("destination") || ""),
      notes: String(formData.get("notes") || ""),
      conditionConfirmed: String(formData.get("conditionConfirmed") || "") === "on",
      photos: filesFromForm(formData),
    });
    redirect(user.role === "ADMIN" ? `/admin/equipment/${result.equipmentId}` : "/employee/jobs?done=delivery");
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/deliver?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function completePickup(formData: FormData) {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  try {
    const result = await completePickupService({
      user,
      eventId: String(formData.get("eventId") || "") || null,
      rentalId: String(formData.get("rentalId") || ""),
      notes: String(formData.get("notes") || ""),
      conditionConfirmed: String(formData.get("conditionConfirmed") || "") === "on",
      hasIssue: String(formData.get("hasIssue") || "") === "yes" ? "yes" : "no",
      afterStatus: String(formData.get("afterStatus") || ""),
      photos: filesFromForm(formData),
    });
    redirect(user.role === "ADMIN" ? `/admin/equipment/${result.equipmentId}` : "/employee/jobs?done=pickup");
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/pickup?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
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
