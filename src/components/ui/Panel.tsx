import Link from "next/link";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  action,
  children,
  padded = true,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-stone-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p> : null}
          </div>
          {action ? (
            <Link href={action.href} className="shrink-0 text-sm font-medium text-orange-700">
              {action.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function DataTable({ children, minWidth = "720px" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function MetricChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-stone-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function AttentionBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{children}</div>
  );
}

export function StackList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-stone-100">{children}</div>;
}
