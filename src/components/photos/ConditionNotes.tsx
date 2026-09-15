export function ConditionNotes({
  purpose,
  placeholder,
  defaultValue,
}: {
  purpose: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">
        Condition notes <span className="text-orange-700">*</span>
      </span>
      <p className="mt-1 text-sm text-stone-500">{purpose}</p>
      <textarea className="field mt-1.5" name="notes" rows={4} required minLength={3} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

export function ConditionConfirm({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
      <input className="mt-1 h-4 w-4 shrink-0" type="checkbox" name="conditionConfirmed" value="on" required />
      <span>
        <span className="font-semibold text-stone-900">Confirm equipment condition</span>
        <span className="mt-1 block">{label}</span>
      </span>
    </label>
  );
}
