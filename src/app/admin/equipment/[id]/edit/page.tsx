import { notFound } from "next/navigation";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateEquipment } from "@/lib/actions/equipment";
import { prisma } from "@/lib/prisma";
import { EquipmentFields } from "@/components/EquipmentFields";

export default async function EditEquipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit #${equipment.number}`} subtitle="Update rates, status, and billing." />
      <ErrorBanner message={error} />
      <form action={updateEquipment} className="card space-y-4 p-6">
        <EquipmentFields equipment={equipment} />
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </form>
    </div>
  );
}
