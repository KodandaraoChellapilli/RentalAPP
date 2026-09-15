export function WorkflowSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={step}
            className={`rounded-xl border px-3 py-2 text-sm ${
              state === "current"
                ? "border-orange-300 bg-orange-50 font-semibold text-stone-900"
                : state === "done"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide">
              Step {index + 1}
              {state === "done" ? " · Done" : state === "current" ? " · Now" : ""}
            </p>
            <p className="mt-1">{step}</p>
          </li>
        );
      })}
    </ol>
  );
}
