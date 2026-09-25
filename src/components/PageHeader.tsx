import Link from "next/link";
import { Alert } from "@/components/ui/Alert";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-stone-500">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="btn btn-primary">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string | string[] }) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text.replaceAll("+", " "));
  } catch {
    decoded = text.replaceAll("+", " ");
  }
  return (
    <Alert variant="error" className="mb-4">
      {decoded}
    </Alert>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="success" className="mb-4">
      {message}
    </Alert>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card px-5 py-8 text-center">
      <p className="font-semibold text-stone-800">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{body}</p>
    </div>
  );
}
