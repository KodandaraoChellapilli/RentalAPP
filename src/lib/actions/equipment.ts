"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BILLING_UNITS, EQUIPMENT_STATUSES } from "@/lib/constants";

export async function createEquipment(formData: FormData) {
  await requireUser(["ADMIN"]);
  const number = String(formData.get("number") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const rate = Number(formData.get("rate"));
  const billingUnit = String(formData.get("billingUnit") || "DAILY");
  const status = String(formData.get("status") || "AVAILABLE");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!number || !name || !type || !Number.isFinite(rate) || rate < 0) {
    redirect("/admin/equipment/new?error=Please+complete+required+fields");
  }
  if (!BILLING_UNITS.includes(billingUnit as (typeof BILLING_UNITS)[number])) {
    redirect("/admin/equipment/new?error=Invalid+billing+unit");
  }

  const existing = await prisma.equipment.findUnique({ where: { number } });
  if (existing) {
    redirect("/admin/equipment/new?error=Equipment+number+already+exists");
  }

  const equipment = await prisma.equipment.create({
    data: { number, name, type, rate, billingUnit, status, notes },
  });

  revalidatePath("/admin/equipment");
  redirect(`/admin/equipment/${equipment.id}`);
}

export async function updateEquipment(formData: FormData) {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const number = String(formData.get("number") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const rate = Number(formData.get("rate"));
  const billingUnit = String(formData.get("billingUnit") || "DAILY");
  const status = String(formData.get("status") || "AVAILABLE");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !number || !name || !type || !Number.isFinite(rate)) {
    redirect(`/admin/equipment/${id}/edit?error=Please+complete+required+fields`);
  }
  if (!EQUIPMENT_STATUSES.includes(status as (typeof EQUIPMENT_STATUSES)[number])) {
    redirect(`/admin/equipment/${id}/edit?error=Invalid+status`);
  }

  await prisma.equipment.update({
    where: { id },
    data: { number, name, type, rate, billingUnit, status, notes },
  });

  revalidatePath(`/admin/equipment/${id}`);
  redirect(`/admin/equipment/${id}`);
}
