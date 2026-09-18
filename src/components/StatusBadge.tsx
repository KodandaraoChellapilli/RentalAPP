import {
  EQUIPMENT_STATUS_LABELS,
  RENTAL_STATUS_LABELS,
  type EquipmentStatus,
  type RentalStatus,
} from "@/lib/constants";
import { TRANSPORT_STATUS_LABELS, type TransportStatus } from "@/lib/transports";
import { cn } from "@/lib/utils";

const EQUIPMENT_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  SCHEDULED: "bg-sky-100 text-sky-800",
  ON_RENT: "bg-amber-100 text-amber-900",
  PICKUP_SCHEDULED: "bg-orange-100 text-orange-800",
  MAINTENANCE: "bg-violet-100 text-violet-800",
  OUT_OF_SERVICE: "bg-stone-200 text-stone-700",
};

const RENTAL_COLORS: Record<string, string> = {
  SCHEDULED: "bg-sky-100 text-sky-800",
  ACTIVE: "bg-amber-100 text-amber-900",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-700",
};

const TRANSPORT_COLORS: Record<string, string> = {
  NEEDS_TRANSPORT: "bg-stone-100 text-stone-800",
  SCHEDULED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({
  status,
  kind = "equipment",
}: {
  status: string;
  kind?: "equipment" | "rental" | "transport";
}) {
  const label =
    kind === "rental"
      ? RENTAL_STATUS_LABELS[status as RentalStatus] || status
      : kind === "transport"
        ? TRANSPORT_STATUS_LABELS[status as TransportStatus] || status
        : EQUIPMENT_STATUS_LABELS[status as EquipmentStatus] || status;
  const color =
    kind === "rental" ? RENTAL_COLORS[status] : kind === "transport" ? TRANSPORT_COLORS[status] : EQUIPMENT_COLORS[status];

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide", color || "bg-stone-100")}>
      {label}
    </span>
  );
}
