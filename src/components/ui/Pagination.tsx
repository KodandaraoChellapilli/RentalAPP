"use client";

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm">
      <p className="text-stone-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <button className="btn btn-ghost" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    pageCount,
    items: items.slice(start, start + pageSize),
  };
}
