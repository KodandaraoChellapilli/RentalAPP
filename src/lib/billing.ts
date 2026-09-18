import type { BillingUnit } from "@/lib/constants";

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;

export type ChargeResult = {
  durationMs: number;
  billedUnits: number;
  amount: number;
  unitLabel: string;
};

export function calculateCharge(
  startAt: Date | string,
  endAt: Date | string,
  rate: number,
  unit: BillingUnit | string,
): ChargeResult {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMs = Math.max(0, end.getTime() - start.getTime());

  let billedUnits = 1;
  let unitLabel = "day";

  if (unit === "HOURLY") {
    billedUnits = Math.max(1, Math.ceil(durationMs / HOUR_MS));
    unitLabel = billedUnits === 1 ? "hour" : "hours";
  } else if (unit === "WEEKLY") {
    billedUnits = Math.max(1, Math.ceil(durationMs / (DAY_MS * 7)));
    unitLabel = billedUnits === 1 ? "week" : "weeks";
  } else {
    billedUnits = Math.max(1, Math.ceil(durationMs / DAY_MS));
    unitLabel = billedUnits === 1 ? "day" : "days";
  }

  if (durationMs === 0) {
    billedUnits = 1;
  }

  return {
    durationMs,
    billedUnits,
    amount: roundMoney(billedUnits * rate),
    unitLabel,
  };
}

export function rentalCharge(
  startAt: Date | string | null,
  endAt: Date | string | null,
  rate: number,
  unit: BillingUnit | string,
  status: string,
  finalAmount?: number | null,
  asOf?: Date | string | number | null,
) {
  if (status === "COMPLETED" && finalAmount != null) {
    const durationMs =
      startAt && endAt ? Math.max(0, new Date(endAt).getTime() - new Date(startAt).getTime()) : 0;
    return {
      durationMs,
      billedUnits: 0,
      amount: roundMoney(finalAmount),
      unitLabel: unitLabelFor(unit),
      isEstimate: false,
    };
  }

  if (!startAt || status === "SCHEDULED" || status === "CANCELLED") {
    return {
      durationMs: 0,
      billedUnits: 0,
      amount: 0,
      unitLabel: unitLabelFor(unit),
      isEstimate: true,
    };
  }

  const end =
    status === "ACTIVE"
      ? new Date(asOf ?? Date.now())
      : endAt
        ? new Date(endAt)
        : new Date(asOf ?? Date.now());
  return { ...calculateCharge(startAt, end, rate, unit), isEstimate: status === "ACTIVE" };
}

export function formatDuration(durationMs: number) {
  if (durationMs <= 0) return "0h";
  const totalMinutes = Math.floor(durationMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (!days) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRate(rate: number, unit: string) {
  const suffix = unit === "HOURLY" ? "hour" : unit === "WEEKLY" ? "week" : "day";
  return `${formatMoney(rate)}/${suffix}`;
}

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

function unitLabelFor(unit: string) {
  if (unit === "HOURLY") return "hours";
  if (unit === "WEEKLY") return "weeks";
  return "days";
}
