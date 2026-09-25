import Link from "next/link";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRate } from "@/lib/billing";
import { cn, formatDateTime } from "@/lib/utils";

export type RentalCardData = {
  id: string;
  href?: string;
  number: string;
  name: string;
  status: string;
  startAt: Date | string | null;
  endAt?: Date | string | null;
  expectedPickupAt?: Date | string | null;
  rate: number;
  unit: string;
  finalAmount?: number | null;
};

export function RentalCard({
  href,
  number,
  name,
  status,
  startAt,
  expectedPickupAt,
  rate,
  unit,
  finalAmount,
}: RentalCardData) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-stone-500">#{number}</p>
          <h3 className="truncate font-semibold">{name}</h3>
        </div>
        <StatusBadge kind="rental" status={status} />
      </div>
      <p className="mt-2 text-sm text-stone-600">Started {formatDateTime(startAt)}</p>
      <p className="text-sm text-stone-600">Pickup {formatDateTime(expectedPickupAt)}</p>
      <p className="text-sm text-stone-600">{formatRate(rate, unit)}</p>
      <div className="mt-3">
        <LiveCharge compact asOf={Date.now()} startAt={startAt} rate={rate} unit={unit} status={status} finalAmount={finalAmount} />
      </div>
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

export function RentalHistoryRow({
  href,
  number,
  name,
  startAt,
  endAt,
  status,
  rate,
  unit,
  finalAmount,
}: RentalCardData) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium">
          #{number} {name}
        </p>
        <p className="text-sm text-stone-500">
          {formatDateTime(startAt)} → {formatDateTime(endAt)}
        </p>
      </div>
      <LiveCharge compact asOf={Date.now()} startAt={startAt} endAt={endAt} rate={rate} unit={unit} status={status} finalAmount={finalAmount} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-between gap-3 px-4 py-3">{content}</div>;
}
