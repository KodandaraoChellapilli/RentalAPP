"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { deleteCustomerDocument, saveCustomerPdf } from "@/lib/services/documents";

export async function uploadCustomerDocument(formData: FormData) {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const customerId = String(formData.get("customerId") || "");
  const file = formData.get("file");
  const back = `/admin/customers/${customerId}`;
  if (!(file instanceof File)) redirect(`${back}?error=${encodeURIComponent("Choose a PDF file.")}`);
  try {
    await saveCustomerPdf({
      customerId,
      file,
      name: String(formData.get("name") || ""),
      type: "CERTIFICATE_OF_INSURANCE",
      uploadedById: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the document.";
    redirect(`${back}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(back);
  redirect(back);
}

export async function removeCustomerDocument(formData: FormData) {
  await requireUser(["ADMIN", "MANAGER"]);
  const id = String(formData.get("id") || "");
  const customerId = String(formData.get("customerId") || "");
  await deleteCustomerDocument(id);
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}
