import Link from "next/link";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="card px-5 py-8 text-center">
      {icon ? <div className="mx-auto mb-3 text-stone-400">{icon}</div> : null}
      <p className="font-semibold text-stone-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{body}</p>
      {action ? (
        <Link href={action.href} className="btn btn-primary mt-4">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
