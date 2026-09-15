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
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">#{number}</p>
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <StatusBadge kind="rental" status={status} />
      </div>
      <p className="mt-3 text-sm text-stone-600">Started {formatDateTime(startAt)}</p>
      <p className="text-sm text-stone-600">Scheduled pickup {formatDateTime(expectedPickupAt)}</p>
      <p className="text-sm text-stone-600">{formatRate(rate, unit)}</p>
      <div className="mt-4">
        <LiveCharge startAt={startAt} rate={rate} unit={unit} status={status} finalAmount={finalAmount} />
      </div>
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
      <div>
        <p className="font-semibold">
          #{number} {name}
        </p>
        <p className="text-sm text-stone-500">
          {formatDateTime(startAt)} → {formatDateTime(endAt)}
        </p>
      </div>
      <LiveCharge compact startAt={startAt} endAt={endAt} rate={rate} unit={unit} status={status} finalAmount={finalAmount} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center justify-between px-5 py-4 hover:bg-stone-50">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-between px-5 py-4">{content}</div>;
}
