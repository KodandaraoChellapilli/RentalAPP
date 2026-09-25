"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function createCustomer(formData: FormData) {
  const actor = await requireUser(["ADMIN", "MANAGER"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const portalEmail = String(formData.get("portalEmail") || "").trim().toLowerCase();
  const portalPassword = String(formData.get("portalPassword") || "");
  const portalName = String(formData.get("portalName") || "").trim();

  if (!name) redirect("/admin/customers/new?error=Customer+name+is+required");

  const customer = await prisma.customer.create({
    data: { name, email, phone, address, notes },
  });

  if (portalEmail && portalPassword && portalPassword.length < 8) {
    redirect("/admin/customers/new?error=Portal+password+must+be+at+least+8+characters");
  }

  if (actor.role === "ADMIN" && portalEmail && portalPassword) {
    await prisma.user.create({
      data: {
        email: portalEmail,
        passwordHash: await bcrypt.hash(portalPassword, 10),
        name: portalName || name,
        role: "CUSTOMER",
        customerId: customer.id,
      },
    });
  }

  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${customer.id}`);
}

export async function updateCustomer(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !name) redirect(`/admin/customers/${id}?error=Name+is+required`);

  await prisma.customer.update({
    where: { id },
    data: { name, email, phone, address, notes },
  });

  revalidatePath(`/admin/customers/${id}`);
  redirect(`/admin/customers/${id}`);
}

export async function createCustomerPortalUser(formData: FormData) {
  await requireUser(["ADMIN"]);
  const customerId = String(formData.get("customerId") || "");
  const name = String(formData.get("portalName") || "").trim();
  const email = String(formData.get("portalEmail") || "").trim().toLowerCase();
  const password = String(formData.get("portalPassword") || "");

  if (!customerId || !name || !email || !password) {
    redirect(`/admin/customers/${customerId}?error=Portal+name,+email,+and+password+are+required`);
  }
  if (password.length < 8) {
    redirect(`/admin/customers/${customerId}?error=Password+must+be+at+least+8+characters`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/admin/customers/${customerId}?error=Email+already+in+use`);
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "CUSTOMER",
      customerId,
    },
  });

  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}

export async function createEmployee(formData: FormData) {
  await requireUser(["ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim() || null;
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    redirect("/admin/employees/new?error=Name,+email,+and+password+are+required");
  }
  if (password.length < 8) {
    redirect("/admin/employees/new?error=Password+must+be+at+least+8+characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/admin/employees/new?error=Email+already+in+use");

  const employee = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: "EMPLOYEE",
    },
  });

  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${employee.id}`);
}

export async function updateEmployee(formData: FormData) {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim() || null;
  const active = String(formData.get("active") || "true") === "true";
  const password = String(formData.get("password") || "");

  if (!id || !name || !email) {
    redirect(`/admin/employees/${id}?error=Name+and+email+are+required`);
  }
  if (password && password.length < 8) {
    redirect(`/admin/employees/${id}?error=Password+must+be+at+least+8+characters`);
  }

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      active,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  revalidatePath(`/admin/employees/${id}`);
  redirect(`/admin/employees/${id}`);
}
