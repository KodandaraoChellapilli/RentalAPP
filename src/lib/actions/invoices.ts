"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createInvoiceForRental, setInvoiceStatus } from "@/lib/services/invoices";

export async function createInvoice(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const rentalId = String(formData.get("rentalId") || "");
  const dueRaw = String(formData.get("dueDate") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  let invoice;
  try {
    invoice = await createInvoiceForRental({
      rentalId,
      dueDate: dueRaw ? new Date(`${dueRaw}T12:00:00`) : null,
      notes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the invoice.";
    redirect(`/admin/invoices/new?rentalId=${encodeURIComponent(rentalId)}&error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/customers/${invoice.customerId}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function updateInvoiceStatus(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  try {
    await setInvoiceStatus(id, status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the invoice.";
    redirect(`/admin/invoices/${id}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  redirect(`/admin/invoices/${id}`);
}
