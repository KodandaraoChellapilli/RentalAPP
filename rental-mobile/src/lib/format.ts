export function formatWhen(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
  if (role === "ADMIN") return "/(owner)/dashboard";
  if (role === "EMPLOYEE") return "/(employee)/clock";
  return "/(customer)/rentals";
}
