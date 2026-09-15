"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ServiceError } from "@/lib/services/errors";
import { clockInService, clockOutService } from "@/lib/services/clock";

export async function clockIn() {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  try {
    await clockInService(user.id);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/clock?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/employee/clock");
}

export async function clockOut() {
  const user = await requireUser(["EMPLOYEE", "ADMIN"]);
  try {
    await clockOutService(user.id);
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/employee/clock?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/employee/clock");
}
