"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/billing";

export function LiveDuration({
  startAt,
  endAt,
  running,
  asOf,
}: {
  startAt: Date | string;
  endAt?: Date | string | null;
  running?: boolean;
  asOf?: Date | string | number | null;
}) {
  const seed = asOf != null ? new Date(asOf).getTime() : null;
  const [now, setNow] = useState<number | null>(seed);

  useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = new Date(startAt).getTime();
  const end = running ? now ?? start : endAt ? new Date(endAt).getTime() : now ?? start;
  return <span className="tabular-nums">{formatDuration(Math.max(0, end - start))}</span>;
}
