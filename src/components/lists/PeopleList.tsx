"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect, FilterToolbar } from "@/components/ui/FilterToolbar";
import { Pagination, paginate } from "@/components/ui/Pagination";

export type PersonRow = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  active?: boolean;
};

export function PeopleList({
  items,
  emptyTitle,
  emptyBody,
  emptyAction,
  searchPlaceholder,
}: {
  items: PersonRow[];
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: { href: string; label: string };
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const hasActive = items.some((item) => item.active !== undefined);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (hasActive && status === "active" && item.active === false) return false;
      if (hasActive && status === "inactive" && item.active !== false) return false;
      if (!needle) return true;
      return `${item.title} ${item.subtitle} ${item.meta}`.toLowerCase().includes(needle);
    });
  }, [hasActive, items, search, status]);

  const paged = paginate(filtered, page, 10);

  return (
    <div>
      <FilterToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder={searchPlaceholder}
        resultLabel={`${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
      >
        {hasActive ? (
          <FilterSelect
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All people" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        ) : null}
      </FilterToolbar>

      {paged.items.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? emptyTitle : "No matching records"}
          body={items.length === 0 ? emptyBody : "Try a different search."}
          action={items.length === 0 ? emptyAction : undefined}
        />
      ) : (
        <div className="card divide-y divide-stone-100">
          {paged.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stone-50"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-stone-500">{item.subtitle}</p>
              </div>
              <p className="text-sm text-stone-500">{item.meta}</p>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={paged.page} pageCount={paged.pageCount} onPage={setPage} />
    </div>
  );
}
