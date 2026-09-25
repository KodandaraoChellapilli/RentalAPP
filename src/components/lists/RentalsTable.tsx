"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect, FilterToolbar } from "@/components/ui/FilterToolbar";
import { Pagination, paginate } from "@/components/ui/Pagination";
import { RENTAL_STATUSES, RENTAL_STATUS_LABELS } from "@/lib/constants";
import { formatDuration, rentalCharge } from "@/lib/billing";

export type RentalRow = {
  id: string;
  equipmentId: string;
  equipmentLabel: string;
  customerName: string;
  startAt: string | null;
  endAt: string | null;
  expectedPickupAt: string | null;
  status: string;
  rate: number;
  unit: string;
  finalAmount: number | null;
  startLabel: string;
  expectedLabel: string;
  pickupLabel: string;
};

export function RentalsTable({
  items,
  initialStatus = "all",
  asOf,
}: {
  items: RentalRow[];
  initialStatus?: string;
  asOf?: number | string | Date | null;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;
      return `${item.equipmentLabel} ${item.customerName}`.toLowerCase().includes(needle);
    });
  }, [items, search, status]);

  const paged = paginate(filtered, page, 10);
  const counts = {
    SCHEDULED: items.filter((item) => item.status === "SCHEDULED").length,
    ACTIVE: items.filter((item) => item.status === "ACTIVE").length,
    COMPLETED: items.filter((item) => item.status === "COMPLETED").length,
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "all", label: `All (${items.length})` },
          { value: "SCHEDULED", label: `Scheduled (${counts.SCHEDULED})` },
          { value: "ACTIVE", label: `Active (${counts.ACTIVE})` },
          { value: "COMPLETED", label: `Completed (${counts.COMPLETED})` },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`filter-chip ${status === tab.value ? "filter-chip-on" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <FilterToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search equipment or customer"
        resultLabel={`${filtered.length} rental${filtered.length === 1 ? "" : "s"}`}
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
            ...RENTAL_STATUSES.map((value) => ({ value, label: RENTAL_STATUS_LABELS[value] })),
          ]}
        />
      </FilterToolbar>

      {paged.items.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No rentals yet" : "No matching rentals"}
          body={items.length === 0 ? "Scheduled and active rentals will appear here." : "Try a different search or status filter."}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Customer</th>
                <th>Start</th>
                <th>Expected pickup</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((rental) => {
                const charge = rentalCharge(
                  rental.startAt,
                  rental.endAt,
                  rental.rate,
                  rental.unit,
                  rental.status,
                  rental.finalAmount,
                  asOf ?? rental.startAt,
                );
                return (
                  <tr key={rental.id}>
                    <td>
                      <Link className="font-semibold text-stone-900" href={`/admin/equipment/${rental.equipmentId}`}>
                        {rental.equipmentLabel}
                      </Link>
                    </td>
                    <td>{rental.customerName}</td>
                    <td>{rental.startLabel}</td>
                    <td>{rental.expectedLabel}</td>
                    <td>{charge.durationMs ? formatDuration(charge.durationMs) : "—"}</td>
                    <td>
                      <StatusBadge kind="rental" status={rental.status} />
                    </td>
                    <td>
                      <LiveCharge
                        compact
                        asOf={asOf ?? rental.startAt}
                        startAt={rental.startAt}
                        endAt={rental.endAt}
                        rate={rental.rate}
                        unit={rental.unit}
                        status={rental.status}
                        finalAmount={rental.finalAmount}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={paged.page} pageCount={paged.pageCount} onPage={setPage} />
    </div>
  );
}
