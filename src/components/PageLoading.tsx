export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 animate-pulse rounded-xl bg-stone-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card h-28 animate-pulse bg-stone-100" />
        ))}
      </div>
      <div className="card h-64 animate-pulse bg-stone-100" />
    </div>
  );
}
