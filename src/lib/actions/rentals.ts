"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { filesFromForm } from "@/lib/photos";
import { ServiceError } from "@/lib/services/errors";
import { completeDeliveryService, completePickupService } from "@/lib/services/rentals";
import {
  confirmCustomerDeliveryService,
  createScheduleService,
  requestCustomerPickupService,
} from "@/lib/services/schedule";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSchedule(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const type = String(formData.get("type") || "DELIVERY");
  const equipmentId = String(formData.get("equipmentId") || "");
  const customerId = String(formData.get("customerId") || "");
  const employeeId = String(formData.get("employeeId") || "") || null;
  const startAt = new Date(String(formData.get("startAt") || ""));
  const notes = String(formData.get("notes") || "").trim() || null;
  const destination = String(formData.get("destination") || "").trim() || null;
  const expectedPickupAtRaw = String(formData.get("expectedPickupAt") || "");
  const expectedPickupAt = expectedPickupAtRaw ? new Date(expectedPickupAtRaw) : null;
  const rentalId = String(formData.get("rentalId") || "") || null;

  try {
    await createScheduleService({
      type,
      equipmentId,
      customerId,
      employeeId,
      startAt,
      notes,
      destination,
      expectedPickupAt,
      rentalId,
      source: "STAFF",
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/admin/schedule/new?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect("/admin/calendar");
}

export async function completeDelivery(formData: FormData) {
  const user = await requireUser(["EMPLOYEE", "ADMIN", "MANAGER"]);
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
    redirect(user.role === "EMPLOYEE" ? "/employee/jobs?done=delivery" : `/admin/equipment/${result.equipmentId}`);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/deliver?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function completePickup(formData: FormData) {
  const user = await requireUser(["EMPLOYEE", "ADMIN", "MANAGER"]);
  try {
    const rawIssue = String(formData.get("hasIssue") || "");
    if (rawIssue !== "yes" && rawIssue !== "no") {
      throw new ServiceError("Report whether there is damage or an issue.");
    }
    const result = await completePickupService({
      user,
      eventId: String(formData.get("eventId") || "") || null,
      rentalId: String(formData.get("rentalId") || ""),
      notes: String(formData.get("notes") || ""),
      conditionConfirmed: String(formData.get("conditionConfirmed") || "") === "on",
      hasIssue: rawIssue,
      afterStatus: String(formData.get("afterStatus") || ""),
      photos: filesFromForm(formData),
    });
    redirect(user.role === "EMPLOYEE" ? "/employee/jobs?done=pickup" : `/admin/equipment/${result.equipmentId}`);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/pickup?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function assignScheduleEmployee(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const eventId = String(formData.get("eventId") || "");
  const employeeId = String(formData.get("employeeId") || "") || null;
  if (!eventId) redirect("/admin/calendar?error=Select+a+scheduled+job");

  await prisma.scheduleEvent.update({
    where: { id: eventId },
    data: { employeeId },
  });

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: { equipment: true, customer: true },
  });
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/transports");
  revalidatePath("/employee/jobs");
  if (event?.equipmentId) revalidatePath(`/admin/equipment/${event.equipmentId}`);
  if (event?.employeeId) revalidatePath(`/admin/employees/${event.employeeId}`);
  redirect("/admin/calendar");
}

export async function requestCustomerPickup(formData: FormData) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const rentalId = String(formData.get("rentalId") || "");
  try {
    await requestCustomerPickupService({
      user,
      rentalId,
      pickupDate: String(formData.get("pickupDate") || ""),
      pickupTime: String(formData.get("pickupTime") || ""),
      pickupLocation: String(formData.get("pickupLocation") || ""),
    });
    redirect(`/customer/rentals/${rentalId}?requested=1`);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/customer/rentals/${rentalId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function confirmCustomerDelivery(formData: FormData) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const rentalId = String(formData.get("rentalId") || "");
  try {
    await confirmCustomerDeliveryService({ user, rentalId });
    redirect(`/customer/rentals/${rentalId}?confirmed=1`);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/customer/rentals/${rentalId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}
