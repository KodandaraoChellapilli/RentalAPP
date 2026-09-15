import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export function EquipmentCard({
  href,
  number,
  name,
  type,
  status,
  rateLabel,
  customerName,
  actionLabel,
}: {
  href?: string;
  number: string;
  name: string;
  type?: string | null;
  status: string;
  rateLabel?: string;
  customerName?: string | null;
  actionLabel?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">#{number}</p>
          <h3 className="mt-1 text-lg font-semibold">{name}</h3>
          {type ? <p className="text-sm text-stone-500">{type}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>
      {rateLabel ? <p className="mt-3 text-sm text-stone-600">{rateLabel}</p> : null}
      {customerName ? (
        <p className="text-sm text-stone-600">{customerName}</p>
      ) : (
        <p className="text-sm text-stone-500">No current customer</p>
      )}
      {actionLabel ? <p className="mt-3 text-sm font-medium text-orange-700">{actionLabel}</p> : null}
    </>
  );
  const className = cn("card p-5", href && "block transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md");
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
