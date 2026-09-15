"use server";

import { redirect } from "next/navigation";
import { clearSession, getSession, setSession } from "@/lib/session";
import { homeFor } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-next";
import { ServiceError } from "@/lib/services/errors";
import { loginService } from "@/lib/services/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  try {
    const { user } = await loginService(email, password);
    await setSession(user);
    redirect(safeNextPath(next, user.role) || homeFor(user.role));
  } catch (error) {
    if (error instanceof ServiceError) {
      redirect(`/login?${new URLSearchParams({ error: error.message, ...(next ? { next } : {}) }).toString()}`);
    }
    throw error;
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login?reason=expired");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  function fail(message: string): never {
    redirect(`/account?error=${encodeURIComponent(message)}`);
  }

  if (!currentPassword) fail("Current password is required.");
  if (newPassword.length < 8) fail("New password must be at least 8 characters.");
  if (newPassword !== confirmPassword) fail("Passwords do not match.");

  const { prisma } = await import("@/lib/prisma");
  const bcrypt = (await import("bcryptjs")).default;
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) fail("Account was not found.");

  const ok = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!ok) fail("Current password is incorrect.");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  redirect("/account?updated=1");
}
