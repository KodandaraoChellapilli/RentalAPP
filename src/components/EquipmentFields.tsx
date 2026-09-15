import { Field } from "@/components/ui/Field";
import { BILLING_UNITS, BILLING_UNIT_LABELS, EQUIPMENT_STATUSES, EQUIPMENT_STATUS_LABELS } from "@/lib/constants";

export function EquipmentFields({
  equipment,
}: {
  equipment?: {
    id?: string;
    number: string;
    name: string;
    type: string;
    rate: number;
    billingUnit: string;
    status: string;
    notes: string | null;
  };
}) {
  return (
    <>
      {equipment?.id ? <input type="hidden" name="id" value={equipment.id} /> : null}
      <Field label="Equipment number">
        <input className="field" name="number" required defaultValue={equipment?.number} placeholder="306" />
      </Field>
      <Field label="Name">
        <input className="field" name="name" required defaultValue={equipment?.name} placeholder="Mini Excavator" />
      </Field>
      <Field label="Type">
        <input className="field" name="type" required defaultValue={equipment?.type} placeholder="Excavator" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rental rate">
          <input className="field" name="rate" type="number" min="0" step="0.01" required defaultValue={equipment?.rate ?? 300} />
        </Field>
        <Field label="Billing">
          <select className="field" name="billingUnit" defaultValue={equipment?.billingUnit ?? "DAILY"}>
            {BILLING_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {BILLING_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Status">
        <select className="field" name="status" defaultValue={equipment?.status ?? "AVAILABLE"}>
          {EQUIPMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {EQUIPMENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description / maintenance notes">
        <textarea
          className="field"
          name="notes"
          rows={3}
          defaultValue={equipment?.notes ?? ""}
          placeholder="Specs, condition, or maintenance information"
        />
      </Field>
    </>
  );
}
