import type { ReactNode } from "react";

export function JobSummary({
  title,
  number,
  name,
  customer,
  location,
  extra,
}: {
  title: string;
  number?: string | null;
  name?: string | null;
  customer?: string | null;
  location?: string | null;
  extra?: ReactNode;
}) {
  return (
    <section className="card mb-4 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">{title}</p>
      <h2 className="mt-1 text-xl font-semibold text-stone-900">
        {number ? `#${number} ${name}` : name || "Select equipment"}
      </h2>
      <div className="mt-3 grid gap-1 text-sm text-stone-600">
        {customer ? <p>Customer: {customer}</p> : null}
        {location ? <p>Delivery location: {location}</p> : null}
        {extra}
      </div>
    </section>
  );
}
