"use client";

import { useEffect, useState } from "react";
import { rentalCharge, formatMoney, formatDuration } from "@/lib/billing";

export function LiveCharge({
  startAt,
  endAt,
  rate,
  unit,
  status,
  finalAmount,
  compact = false,
  asOf,
}: {
  startAt: Date | string | null;
  endAt?: Date | string | null;
  rate: number;
  unit: string;
  status: string;
  finalAmount?: number | null;
  compact?: boolean;
  asOf?: Date | string | number | null;
}) {
  const seed = asOf != null ? new Date(asOf).getTime() : null;
  const [now, setNow] = useState<number | null>(seed);

  useEffect(() => {
    setNow(Date.now());
    if (status !== "ACTIVE") return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [status]);

  const charge = rentalCharge(
    startAt,
    endAt || null,
    rate,
    unit,
    status,
    finalAmount,
    now ?? startAt,
  );

  if (compact) {
    return (
      <span className="font-semibold tabular-nums">
        {formatMoney(charge.amount)}
        {charge.isEstimate ? <span className="ml-1 text-xs font-medium text-stone-500">est.</span> : null}
      </span>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-stone-500">
        {charge.isEstimate ? "Estimated Current Charge" : "Final Rental Amount"}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{formatMoney(charge.amount)}</p>
      <p className="mt-1 text-sm text-stone-500">
        {charge.durationMs ? `${formatDuration(charge.durationMs)} · ${formatMoney(rate)}/${charge.unitLabel.replace(/s$/, "")}` : "Rental has not started"}
      </p>
    </div>
  );
}
