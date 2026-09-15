import { EquipmentFields } from "@/components/EquipmentFields";
import { ErrorBanner, PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createEquipment } from "@/lib/actions/equipment";

export default async function NewEquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add equipment" subtitle="Give the machine a yard number, rate, and billing unit." />
      <ErrorBanner message={error} />
      <form action={createEquipment} className="card space-y-4 p-6">
        <EquipmentFields />
        <SubmitButton pendingLabel="Saving…">Save equipment</SubmitButton>
      </form>
    </div>
  );
}
