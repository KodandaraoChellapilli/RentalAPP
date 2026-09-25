function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatWhen(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateInput(value: Date) {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

export function toTimeInput(value: Date) {
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

export function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatTimeLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function transportHref(job: { id: string; type: string }) {
  return job.type === "PICKUP" ? `/(employee)/jobs/pickup/${job.id}` : `/(employee)/jobs/deliver/${job.id}`;
}

/** First name from authenticated user.name — never hard-code role names in screens. */
export function firstName(fullName?: string | null) {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0] || null;
}

export function welcomeTitle(fullName?: string | null, fallback = "Welcome") {
  const first = firstName(fullName);
  return first ? `Welcome, ${first}` : fallback;
}

export function homeFor(role: string) {
  if (role === "ADMIN" || role === "MANAGER") return "/(owner)/dashboard";
  if (role === "EMPLOYEE") return "/(employee)/clock";
  return "/(customer)/rentals";
}
