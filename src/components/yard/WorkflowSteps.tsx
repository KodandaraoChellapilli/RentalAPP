export function WorkflowSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                state === "current"
                  ? "font-semibold text-stone-900"
                  : state === "done"
                    ? "text-stone-700"
                    : "text-stone-400"
              }
            >
              {index + 1}. {step}
            </span>
            {index < steps.length - 1 ? <span className="text-stone-300">→</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
