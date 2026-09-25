import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
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
  employeeId?: string | null;
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
    return <EmptyState title={emptyTitle} body={emptyBody} action={{ href: "/admin/schedule/new", label: "Schedule transport" }} />;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Equipment</th>
            <th>Customer</th>
            <th>Location</th>
            <th>When</th>
            <th>Assigned</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => {
            const complete = !job.completedAt ? completeHref(job) : null;
            return (
              <tr key={job.id}>
                <td>
                  <TypeBadge type={job.type} />
                </td>
                <td>
                  {job.equipmentId ? (
                    <Link className="font-medium text-stone-900" href={`/admin/equipment/${job.equipmentId}`}>
                      {job.equipmentLabel || job.title}
                    </Link>
                  ) : (
                    job.title || "—"
                  )}
                </td>
                <td className="max-w-[10rem] truncate">{job.customerName || "—"}</td>
                <td className="max-w-[12rem] truncate">{job.destination || "—"}</td>
                <td>{formatDateTime(job.startAt)}</td>
                <td>{job.employeeName || "Unassigned"}</td>
                <td>
                  <StatusBadge kind="transport" status={transportStatus(job)} />
                  {job.source === "CUSTOMER" && !job.completedAt ? (
                    <p className="mt-1 text-xs text-stone-500">Customer requested</p>
                  ) : null}
                </td>
                <td>
                  {complete ? (
                    <Link className="text-sm font-medium text-orange-800" href={complete}>
                      {job.type === "PICKUP" ? "Open pickup" : "Open delivery"}
                    </Link>
                  ) : (
                    <span className="text-sm text-stone-400">Done</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
