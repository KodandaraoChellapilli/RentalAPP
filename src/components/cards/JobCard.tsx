import Link from "next/link";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
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
}: JobCardData) {
  const heading = equipmentLabel || title || EVENT_TYPE_LABELS[type as EventType] || type;
  const isOverdue = overdue ?? new Date(startAt) < new Date();
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
          {EVENT_TYPE_LABELS[type as EventType] || type}
        </p>
        {isOverdue ? <span className="text-xs font-medium text-orange-700">Overdue</span> : null}
      </div>
      <p className="mt-1 font-semibold text-stone-900">{heading}</p>
      <p className="mt-1 text-sm text-stone-600">{formatDateTime(startAt)}</p>
      {customerName ? <p className="text-sm text-stone-600">{customerName}</p> : null}
      {destination ? <p className="text-sm text-stone-500">{destination}</p> : null}
      {rateLabel ? <p className="text-sm text-stone-600">{rateLabel}</p> : null}
      {employeeName !== undefined ? (
        <p className="text-sm text-stone-500">{employeeName ? `Assigned: ${employeeName}` : "Unassigned"}</p>
      ) : null}
      {actionLabel ? <p className="mt-3 text-sm font-medium text-orange-700">{actionLabel}</p> : null}
    </>
  );

  const className = cn("card p-4", href && "block transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md");
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
