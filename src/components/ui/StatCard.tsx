import Link from "next/link";

export function StatCard({
  title,
  value,
  subtitle,
  href,
  primary = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  primary?: boolean;
}) {
  const inner = (
    <>
      <p className="ops-cell-label">{title}</p>
      <p className="ops-cell-value">{value}</p>
      {subtitle ? <p className="ops-cell-meta">{subtitle}</p> : null}
    </>
  );

  const className = `ops-cell ${primary ? "ops-cell-primary" : ""}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
