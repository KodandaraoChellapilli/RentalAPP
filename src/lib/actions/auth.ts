"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSession, getSession, setSession } from "@/lib/session";
import { homeFor, isRole } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  function fail(message: string): never {
    redirect(`/login?${new URLSearchParams({ error: message, ...(next ? { next } : {}) }).toString()}`);
  }

  if (!email || !password) {
    fail("Email and password are required.");
  }
  if (!EMAIL_RE.test(email)) {
    fail("Enter a valid email address.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    fail("Invalid email or password.");
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    fail("Invalid email or password.");
    return;
  }

  if (!isRole(user.role)) {
    fail("This account cannot sign in.");
    return;
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
  });

  redirect(safeNextPath(next, user.role) || homeFor(user.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login?reason=expired");
  if (!user) return;

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  function fail(message: string): never {
    redirect(`/account?error=${encodeURIComponent(message)}`);
  }

  if (!currentPassword) fail("Current password is required.");
  if (newPassword.length < 8) fail("New password must be at least 8 characters.");
  if (newPassword !== confirmPassword) fail("Passwords do not match.");

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
