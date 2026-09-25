"use client";

import { useMemo, useState } from "react";
import { ConfirmForm } from "@/components/ConfirmForm";
import { BeforeDeliveryPhotos } from "@/components/photos/BeforeDeliveryPhotos";
import { ConditionConfirm, ConditionNotes } from "@/components/photos/ConditionNotes";
import { EquipmentPhotoUpload } from "@/components/photos/EquipmentPhotoUpload";
import { completePickup } from "@/lib/actions/rentals";
import { formatRate } from "@/lib/billing";
import type { PhotoView } from "@/lib/photo-labels";
import { formatDateTime } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { JobSummary } from "@/components/yard/JobSummary";
import { WorkflowSteps } from "@/components/yard/WorkflowSteps";

type PickupRental = {
  id: string;
  startAt: Date | string | null;
  destination: string | null;
  expectedPickupAt: Date | string | null;
  rateSnapshot: number;
  billingUnitSnapshot: string;
  equipment: { number: string; name: string };
  customer: { name: string };
  beforePhotos: PhotoView[];
};

export function PickupForm({
  rentals,
  eventId,
  initialRentalId,
}: {
  rentals: PickupRental[];
  eventId?: string;
  initialRentalId?: string;
}) {
  const [rentalId, setRentalId] = useState(initialRentalId || rentals[0]?.id || "");
  const [hasIssue, setHasIssue] = useState<"yes" | "no" | "">("");
  const [photoCount, setPhotoCount] = useState(0);
  const selected = useMemo(
    () => rentals.find((rental) => rental.id === rentalId) || null,
    [rentals, rentalId],
  );

  return (
    <>
      <WorkflowSteps
        current={selected ? 2 : 0}
        steps={["Job", "Inspect", "Photos", "Complete"]}
      />
      {selected ? (
        <JobSummary
          title="Active rental / pickup"
          number={selected.equipment.number}
          name={selected.equipment.name}
          customer={selected.customer.name}
          location={selected.destination}
          extra={
            <>
              <p>Rental started: {formatDateTime(selected.startAt)}</p>
              <p>{formatRate(selected.rateSnapshot, selected.billingUnitSnapshot)}</p>
              <p>Expected pickup: {formatDateTime(selected.expectedPickupAt)}</p>
            </>
          }
        />
      ) : null}
      <ConfirmForm
        action={completePickup}
        message="Confirm the after-pickup photos show the returned condition? Completing pickup stops the rental timer, stores the final charge, and sets the equipment status you selected."
        confirmLabel="Complete pickup"
        className="card space-y-5 p-4"
      >
        {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
        <label className="block">
          <span className="field-label">Active rental</span>
          <select
            className="field mt-1.5"
            name="rentalId"
            required
            value={rentalId}
            onChange={(event) => setRentalId(event.target.value)}
          >
            <option value="">Select equipment on rent</option>
            {rentals.map((rental) => (
              <option key={rental.id} value={rental.id}>
                #{rental.equipment.number} {rental.equipment.name} · {rental.customer.name}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <section className="rounded border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-900">Before photos</p>
            <p className="mt-1 text-sm text-stone-600">Compare these with the return photos you take next.</p>
            <div className="mt-3">
              <BeforeDeliveryPhotos photos={selected.beforePhotos} showHeading={false} />
            </div>
          </section>
        ) : (
          <p className="text-sm text-stone-500">No active rentals to pick up.</p>
        )}
        <EquipmentPhotoUpload mode="after" onCountChange={setPhotoCount} />
        <ConditionNotes
          purpose="Describe returned condition, hours, fuel, missing accessories, and any damage."
          placeholder="Example: Scratches on the bucket. Tracks muddy. No fluid leaks."
        />
        <fieldset className="space-y-2">
          <legend className="field-label">
            Is there damage or an issue? <span className="text-orange-700">*</span>
          </legend>
          <label className="flex items-start gap-3 rounded border border-stone-200 bg-white px-4 py-3 text-sm">
            <input
              className="mt-1"
              type="radio"
              name="hasIssue"
              value="no"
              required
              checked={hasIssue === "no"}
              onChange={() => setHasIssue("no")}
            />
            <span>No — equipment is in good condition and can return to Available if you choose that status.</span>
          </label>
          <label className="flex items-start gap-3 rounded border border-stone-200 bg-white px-4 py-3 text-sm">
            <input
              className="mt-1"
              type="radio"
              name="hasIssue"
              value="yes"
              required
              checked={hasIssue === "yes"}
              onChange={() => setHasIssue("yes")}
            />
            <span>Yes — damage or an issue to report. Do not make this equipment Available.</span>
          </label>
        </fieldset>
        {hasIssue === "no" ? (
          <label className="block">
            <span className="field-label">After pickup, set equipment to</span>
            <select className="field mt-1.5" name="afterStatus" defaultValue="AVAILABLE">
              <option value="AVAILABLE">Available — ready for the next rental</option>
              <option value="MAINTENANCE">Maintenance — inspect or service before renting again</option>
              <option value="OUT_OF_SERVICE">Out of service — unavailable</option>
            </select>
          </label>
        ) : null}
        {hasIssue === "yes" ? (
          <label className="block">
            <span className="field-label">After pickup, set equipment to</span>
            <p className="mt-1 text-sm text-amber-800">
              Damaged equipment cannot automatically become Available for another rental.
            </p>
            <select className="field mt-1.5" name="afterStatus" defaultValue="MAINTENANCE">
              <option value="MAINTENANCE">Maintenance — needs inspection or repair</option>
              <option value="OUT_OF_SERVICE">Out of service — seriously damaged or unavailable</option>
            </select>
          </label>
        ) : null}
        <ConditionConfirm label="I inspected this equipment after pickup and confirm these photos show the returned condition." />
        <SubmitButton className="w-full" disabled={!selected || photoCount < 1} pendingLabel="Recording pickup…">
          Confirm condition & complete pickup
        </SubmitButton>
        {photoCount < 1 ? (
          <p className="text-center text-sm text-orange-800">Add at least one after-pickup photo to continue.</p>
        ) : null}
      </ConfirmForm>
    </>
  );
}
