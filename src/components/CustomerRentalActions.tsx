import { requestCustomerPickup, confirmCustomerDelivery } from "@/lib/actions/rentals";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CustomerEndRentalForm({
  rentalId,
  defaultLocation,
}: {
  rentalId: string;
  defaultLocation?: string | null;
}) {
  return (
    <form action={requestCustomerPickup} className="card mt-6 space-y-4 p-5">
      <input type="hidden" name="rentalId" value={rentalId} />
      <div>
        <h2 className="font-semibold">End rental</h2>
        <p className="mt-1 text-sm text-stone-500">
          Request a pickup. The rental stays active until the yard completes the pickup.
        </p>
      </div>
      <label className="block">
        <span className="field-label">When would you like this equipment picked up?</span>
        <input className="field mt-1.5" type="date" name="pickupDate" required />
      </label>
      <label className="block">
        <span className="field-label">Pickup time</span>
        <input className="field mt-1.5" type="time" name="pickupTime" required />
      </label>
      <label className="block">
        <span className="field-label">Pickup location</span>
        <input
          className="field mt-1.5"
          name="pickupLocation"
          required
          defaultValue={defaultLocation || ""}
          placeholder="Jobsite address"
        />
      </label>
      <SubmitButton pendingLabel="Submitting…">Request pickup</SubmitButton>
    </form>
  );
}

export function CustomerConfirmDeliveryForm({ rentalId }: { rentalId: string }) {
  return (
    <form action={confirmCustomerDelivery} className="card mt-6 space-y-3 p-5">
      <input type="hidden" name="rentalId" value={rentalId} />
      <h2 className="font-semibold">Confirm delivery details</h2>
      <p className="text-sm text-stone-500">
        Confirm the scheduled date, time, and location are correct. This does not start the rental.
      </p>
      <SubmitButton pendingLabel="Saving…">Confirm delivery</SubmitButton>
    </form>
  );
}
