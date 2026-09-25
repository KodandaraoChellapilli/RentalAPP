import Link from "next/link";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
import { TypeBadge } from "@/components/StatusBadge";
import { cn, formatDateTime } from "@/lib/utils";

export type JobCardData = {
  id: string;
  type: string;
  title?: string | null;
  startAt: Date | string;
  customerName?: string | null;
  employeeName?: string | null;
  destination?: string | null;
  equipmentLabel?: string | null;
  rateLabel?: string | null;
  href?: string;
  overdue?: boolean;
  actionLabel?: string;
  featured?: boolean;
};

export function JobCard({
  type,
  title,
  startAt,
  customerName,
  employeeName,
  destination,
  equipmentLabel,
  rateLabel,
  href,
  overdue,
  actionLabel,
  featured,
}: JobCardData) {
  const heading = equipmentLabel || title || EVENT_TYPE_LABELS[type as EventType] || type;
  const isOverdue = overdue ?? new Date(startAt) < new Date();
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <TypeBadge type={type} />
        {featured ? (
          <span className="text-xs font-medium text-stone-500">Up next</span>
        ) : isOverdue ? (
          <span className="text-xs font-medium text-orange-800">Overdue</span>
        ) : null}
      </div>
      <p className="mt-2 truncate font-semibold text-stone-900">{heading}</p>
      <p className="mt-1 text-sm text-stone-600">{formatDateTime(startAt)}</p>
      {customerName ? <p className="truncate text-sm text-stone-600">{customerName}</p> : null}
      {destination ? <p className="truncate text-sm text-stone-500">{destination}</p> : null}
      {rateLabel ? <p className="text-sm text-stone-600">{rateLabel}</p> : null}
      {employeeName !== undefined ? (
        <p className="text-sm text-stone-500">{employeeName || "Unassigned"}</p>
      ) : null}
      {actionLabel ? (
        <span className={featured ? "btn btn-primary mt-3 w-full" : "mt-3 inline-block text-sm font-medium text-orange-800"}>
          {actionLabel}
        </span>
      ) : null}
    </>
  );

  const className = cn("card p-4", href && "block hover:bg-stone-50", featured && "border-stone-400");
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
