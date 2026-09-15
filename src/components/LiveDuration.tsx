"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/billing";

export function LiveDuration({
  startAt,
  endAt,
  running,
}: {
  startAt: Date | string;
  endAt?: Date | string | null;
  running?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = new Date(startAt).getTime();
  const end = running ? now : endAt ? new Date(endAt).getTime() : now;
  return <span className="tabular-nums">{formatDuration(Math.max(0, end - start))}</span>;
}
