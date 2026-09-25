"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect, FilterToolbar } from "@/components/ui/FilterToolbar";
import { Pagination, paginate } from "@/components/ui/Pagination";
import { BILLING_UNIT_LABELS, EQUIPMENT_STATUSES, EQUIPMENT_STATUS_LABELS, type BillingUnit } from "@/lib/constants";

export type EquipmentCardItem = {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
  rate: number;
  rateLabel: string;
  billingUnit: string;
  currentCustomer: string | null;
  currentRentalStatus: string | null;
  photoPath?: string | null;
};

export function EquipmentCatalog({ items }: { items: EquipmentCardItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;
      return `${item.number} ${item.name} ${item.type} ${item.currentCustomer || ""}`.toLowerCase().includes(needle);
    });
  }, [items, search, status]);

  const paged = paginate(filtered, page, 12);

  return (
    <div>
      <FilterToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search equipment"
        resultLabel={`${filtered.length} machine${filtered.length === 1 ? "" : "s"}`}
      >
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All statuses" },
            ...EQUIPMENT_STATUSES.map((value) => ({ value, label: EQUIPMENT_STATUS_LABELS[value] })),
          ]}
        />
      </FilterToolbar>

      {paged.items.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No equipment yet" : "No matching machines"}
          body={
            items.length === 0
              ? "Add the first machine so the yard has a number, rate, and history."
              : "Try a different search or status filter."
          }
          action={items.length === 0 ? { href: "/admin/equipment/new", label: "Add equipment" } : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Equipment #</th>
                <th>Equipment</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Rate</th>
                <th>Billing</th>
                <th>Current rental</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoPath} alt="" className="h-12 w-16 rounded object-cover bg-stone-100" />
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="font-semibold">#{item.number}</td>
                  <td>
                    <Link className="font-semibold text-stone-900" href={`/admin/equipment/${item.id}`}>
                      {item.name}
                    </Link>
                    <p className="text-xs text-stone-500">{item.type}</p>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{item.currentCustomer || "—"}</td>
                  <td>{item.rateLabel}</td>
                  <td>{BILLING_UNIT_LABELS[item.billingUnit as BillingUnit] || item.billingUnit}</td>
                  <td>
                    {item.currentRentalStatus ? <StatusBadge kind="rental" status={item.currentRentalStatus} /> : "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link className="text-sm font-medium text-orange-700" href={`/admin/equipment/${item.id}`}>
                        View
                      </Link>
                      <Link className="text-sm font-medium text-stone-500" href={`/admin/equipment/${item.id}/edit`}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={paged.page} pageCount={paged.pageCount} onPage={setPage} />
    </div>
  );
}
