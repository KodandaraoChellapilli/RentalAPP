import { Inbox } from "lucide-react";
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
    <div className="card px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <p className="mt-4 font-semibold text-stone-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{body}</p>
      {action ? (
        <Link href={action.href} className="btn btn-primary mt-5">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
