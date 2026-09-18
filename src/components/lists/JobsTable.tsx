import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
import { transportStatus } from "@/lib/transports";
import { formatDateTime } from "@/lib/utils";

export type JobRow = {
  id: string;
  type: string;
  title: string | null;
  startAt: Date | string;
  completedAt: Date | string | null;
  destination: string | null;
  equipmentId: string | null;
  equipmentLabel: string | null;
  customerName: string | null;
  employeeName: string | null;
  rentalId: string | null;
  source?: string | null;
};

export function JobsTable({
  items,
  emptyTitle,
  emptyBody,
  completeHref,
}: {
  items: JobRow[];
  emptyTitle: string;
  emptyBody: string;
  completeHref: (job: JobRow) => string | null;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} action={{ href: "/admin/schedule/new", label: "New schedule" }} />;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Equipment</th>
            <th>Customer</th>
            <th>Location</th>
            <th>Employee</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => {
            const complete = !job.completedAt ? completeHref(job) : null;
            return (
              <tr key={job.id}>
                <td>
                  <p className="font-medium">{formatDateTime(job.startAt)}</p>
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    {EVENT_TYPE_LABELS[job.type as EventType] || job.type}
                  </p>
                </td>
                <td>
                  {job.equipmentId ? (
                    <Link className="font-semibold text-stone-900" href={`/admin/equipment/${job.equipmentId}`}>
                      {job.equipmentLabel || job.title}
                    </Link>
                  ) : (
                    job.title || "—"
                  )}
                </td>
                <td>{job.customerName || "—"}</td>
                <td>{job.destination || "—"}</td>
                <td>{job.employeeName || "Unassigned"}</td>
                <td>
                  <StatusBadge kind="transport" status={transportStatus(job)} />
                  {job.source === "CUSTOMER" && !job.completedAt ? (
                    <p className="mt-1 text-xs text-stone-500">Customer requested pickup</p>
                  ) : null}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link className="text-sm font-medium text-stone-500" href="/admin/calendar">
                      Calendar
                    </Link>
                    {complete ? (
                      <Link className="text-sm font-medium text-orange-700" href={complete}>
                        Open inspection
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
