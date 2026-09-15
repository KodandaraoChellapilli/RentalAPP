export function formatWhen(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function homeFor(role: string) {
  if (role === "ADMIN") return "/(owner)/dashboard";
  if (role === "EMPLOYEE") return "/(employee)/clock";
  return "/(customer)/rentals";
}
