"use client";

import { useState } from "react";
import { ConfirmForm } from "@/components/ConfirmForm";
import { ConditionConfirm, ConditionNotes } from "@/components/photos/ConditionNotes";
import { EquipmentPhotoUpload } from "@/components/photos/EquipmentPhotoUpload";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { completeDelivery } from "@/lib/actions/rentals";

type Option = { id: string; number: string; name: string };
type Customer = { id: string; name: string };

export function DeliveryForm({
  eventId,
  rentalId,
  equipmentId,
  customerId,
  destination,
  equipment,
  extraEquipment,
  customers,
}: {
  eventId?: string;
  rentalId?: string | null;
  equipmentId?: string | null;
  customerId?: string | null;
  destination?: string | null;
  equipment: Option[];
  extraEquipment?: Option | null;
  customers: Customer[];
}) {
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <ConfirmForm
      action={completeDelivery}
      message="Confirm the before-delivery photos show the equipment's initial condition? Completing delivery starts the rental and sets the equipment to Active / On Rent."
      confirmLabel="Complete delivery"
      className="card space-y-5 p-6"
    >
      {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
      {rentalId ? <input type="hidden" name="rentalId" value={rentalId} /> : null}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">1. Equipment and customer</h2>
        <label className="block">
          <span className="field-label">Equipment</span>
          <select className="field mt-1.5" name="equipmentId" required defaultValue={equipmentId || ""}>
            <option value="">Select equipment</option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.number} {item.name}
              </option>
            ))}
            {extraEquipment && !equipment.some((item) => item.id === extraEquipment.id) ? (
              <option value={extraEquipment.id}>
                #{extraEquipment.number} {extraEquipment.name}
              </option>
            ) : null}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Customer</span>
          <select className="field mt-1.5" name="customerId" required defaultValue={customerId || ""}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Delivery location</span>
          <input
            className="field mt-1.5"
            name="destination"
            required
            defaultValue={destination || ""}
            placeholder="Jobsite address"
          />
        </label>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">2. Inspect the equipment</h2>
        <p className="text-sm text-stone-600">
          Walk around the machine before it leaves. Photograph front, back, sides, attachments, and any existing wear.
        </p>
      </section>
      <EquipmentPhotoUpload mode="before" onCountChange={setPhotoCount} />
      <ConditionNotes
        purpose="Describe hours, fuel, accessories, existing wear, and overall condition before delivery."
        placeholder="Example: Bucket and tracks look clean. Light wear on the left boom. Full fuel. No new damage."
      />
      <ConditionConfirm label="I inspected this equipment and confirm these photos show the condition before delivery. The rental can start after this step." />
      <SubmitButton className="w-full" disabled={photoCount < 1} pendingLabel="Recording delivery…">
        Confirm condition & complete delivery
      </SubmitButton>
      {photoCount < 1 ? (
        <p className="text-center text-sm text-orange-800">Add at least one before-delivery photo to continue.</p>
      ) : null}
    </ConfirmForm>
  );
}
