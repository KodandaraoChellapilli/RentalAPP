import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  subtitle,
  href,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "border-orange-200"
      : tone === "success"
        ? "border-emerald-200"
        : tone === "warning"
          ? "border-amber-200"
          : "";

  const content = (
    <div className={cn("card p-5 transition", href && "hover:-translate-y-0.5 hover:shadow-md", toneClass)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-stone-500">{subtitle}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
