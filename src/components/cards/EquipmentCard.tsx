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
  photoPath,
}: {
  href?: string;
  number: string;
  name: string;
  type?: string | null;
  status: string;
  rateLabel?: string;
  customerName?: string | null;
  actionLabel?: string;
  photoPath?: string | null;
}) {
  const content = (
    <>
      {photoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoPath} alt={`#${number} ${name}`} className="mb-3 h-36 w-full rounded bg-stone-100 object-cover" />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-stone-500">#{number}</p>
          <h3 className="truncate font-semibold">{name}</h3>
          {type ? <p className="truncate text-sm text-stone-500">{type}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>
      {rateLabel ? <p className="mt-2 text-sm text-stone-600">{rateLabel}</p> : null}
      {customerName ? <p className="truncate text-sm text-stone-600">{customerName}</p> : null}
      {actionLabel ? <p className="mt-2 text-sm font-medium text-orange-800">{actionLabel}</p> : null}
    </>
  );
  const className = cn("card p-4", href && "block hover:bg-stone-50");
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
