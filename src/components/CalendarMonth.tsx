"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LiveCharge } from "@/components/LiveCharge";
import { StatusBadge } from "@/components/StatusBadge";
import { assignScheduleEmployee } from "@/lib/actions/rentals";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/SubmitButton";

type CalendarEvent = {
  id: string;
  type: string;
  title: string | null;
  startAt: Date | string;
  completedAt: Date | string | null;
  destination: string | null;
  notes: string | null;
  equipment?: { id: string; number: string; name: string } | null;
  customer?: { name: string } | null;
  employee?: { id: string; name: string } | null;
  rental?: {
    id: string;
    status: string;
    startAt: Date | string | null;
    expectedPickupAt: Date | string | null;
    rateSnapshot: number;
    billingUnitSnapshot: string;
    finalAmount: number | null;
  } | null;
};

export function CalendarMonth({
  events,
  employees,
}: {
  events: CalendarEvent[];
  employees: { id: string; name: string }[];
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedEvents = events.filter((event) => isSameDay(new Date(event.startAt), selected));
  const selectedEvent = events.find((event) => event.id === selectedEventId) || selectedEvents[0] || null;

  function chooseDay(day: Date) {
    setSelected(day);
    const first = events.find((event) => isSameDay(new Date(event.startAt), day));
    setSelectedEventId(first?.id || null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => setCursor((d) => addMonths(d, -1))}>
              Prev
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setCursor(new Date())}>
              Today
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setCursor((d) => addMonths(d, 1))}>
              Next
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(new Date(event.startAt), day));
            const current = isSameDay(day, selected);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 rounded-xl border p-2 text-left",
                  isSameMonth(day, cursor) ? "bg-white" : "bg-stone-50 text-stone-400",
                  current ? "border-orange-500 ring-2 ring-orange-200" : "border-stone-200",
                )}
              >
                <button type="button" onClick={() => chooseDay(day)} className="text-sm font-semibold">
                  {format(day, "d")}
                </button>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setSelected(day);
                        setSelectedEventId(event.id);
                      }}
                      className={cn(
                        "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
                        event.id === selectedEventId
                          ? "bg-stone-900 text-white"
                          : event.type === "PICKUP"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-sky-100 text-sky-800",
                      )}
                    >
                      {format(new Date(event.startAt), "h:mm a")} {event.equipment ? `#${event.equipment.number}` : event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 ? <p className="text-[10px] text-stone-500">+{dayEvents.length - 3} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold">{format(selected, "EEEE, MMM d")}</h3>
        {selectedEvents.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  event.id === selectedEvent?.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700",
                )}
              >
                {format(new Date(event.startAt), "h:mm a")} {event.equipment ? `#${event.equipment.number}` : event.type}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          {!selectedEvent ? (
            <p className="text-sm text-stone-500">No scheduled deliveries or pickups.</p>
          ) : (
            <EventDetail event={selectedEvent} employees={employees} />
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetail({
  event,
  employees,
}: {
  event: CalendarEvent;
  employees: { id: string; name: string }[];
}) {
  const recordHref =
    event.completedAt
      ? null
      : event.type === "PICKUP"
        ? `/employee/pickup?eventId=${event.id}&rentalId=${event.rental?.id || ""}`
        : `/employee/deliver?eventId=${event.id}`;

  return (
    <article className="rounded-2xl border border-stone-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {EVENT_TYPE_LABELS[event.type as EventType] || event.type}
      </p>
      <h4 className="mt-1 font-semibold">
        {event.equipment ? `#${event.equipment.number} ${event.equipment.name}` : event.title}
      </h4>
      <p className="text-sm text-stone-600">{formatDateTime(event.startAt)}</p>
      {event.customer ? <p className="text-sm text-stone-600">Customer: {event.customer.name}</p> : null}
      {event.employee ? <p className="text-sm text-stone-600">Assigned: {event.employee.name}</p> : <p className="text-sm text-amber-700">Unassigned</p>}
      {event.destination ? <p className="text-sm text-stone-600">{event.destination}</p> : null}
      {event.notes ? <p className="text-sm text-stone-500">{event.notes}</p> : null}
      {event.completedAt ? <p className="mt-2 text-xs font-medium text-emerald-700">Completed {formatDateTime(event.completedAt)}</p> : null}

      {event.rental ? (
        <div className="mt-4 space-y-2 rounded-xl bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rental</p>
            <StatusBadge kind="rental" status={event.rental.status} />
          </div>
          <p className="text-sm text-stone-600">Started {formatDateTime(event.rental.startAt)}</p>
          <p className="text-sm text-stone-600">Expected pickup {formatDateTime(event.rental.expectedPickupAt)}</p>
          <LiveCharge
            compact
            startAt={event.rental.startAt}
            rate={event.rental.rateSnapshot}
            unit={event.rental.billingUnitSnapshot}
            status={event.rental.status}
            finalAmount={event.rental.finalAmount}
          />
        </div>
      ) : null}

      {!event.completedAt ? (
        <form key={event.id} action={assignScheduleEmployee} className="mt-4 space-y-2">
          <input type="hidden" name="eventId" value={event.id} />
          <label className="block">
            <span className="field-label">Assign employee</span>
            <select className="field mt-1.5" name="employeeId" defaultValue={event.employee?.id || ""}>
              <option value="">Unassigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton variant="dark" className="w-full" pendingLabel="Saving…">
            Save assignment
          </SubmitButton>
        </form>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {event.equipment ? (
          <Link className="text-sm font-medium text-orange-700" href={`/admin/equipment/${event.equipment.id}`}>
            View equipment
          </Link>
        ) : null}
        {recordHref ? (
          <Link className="text-sm font-medium text-orange-700" href={recordHref}>
            {event.type === "PICKUP" ? "Record pickup" : "Record delivery"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
