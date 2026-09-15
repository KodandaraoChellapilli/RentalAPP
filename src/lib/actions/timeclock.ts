"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function clockIn() {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId: user.id, clockOut: null },
  });
  if (open) {
    redirect("/employee/clock?error=You+are+already+clocked+in");
  }

  await prisma.timeEntry.create({
    data: { employeeId: user.id, clockIn: new Date() },
  });

  revalidatePath("/employee/clock");
  revalidatePath("/admin/hours");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/employees");
  redirect("/employee/clock");
}

export async function clockOut() {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId: user.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) {
    redirect("/employee/clock?error=You+are+not+clocked+in");
  }

  await prisma.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
  });

  revalidatePath("/employee/clock");
  revalidatePath("/admin/hours");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/employees");
  redirect("/employee/clock");
}
