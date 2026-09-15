export const colors = {
  ink: "#14110e",
  bg: "#f3eee6",
  surface: "#ffffff",
  muted: "#78716c",
  line: "#e7e0d4",
  accent: "#c2410c",
  accentDark: "#9a3412",
  success: "#047857",
  successBg: "#ecfdf5",
  warning: "#b45309",
  warningBg: "#fffbeb",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  white: "#ffffff",
  amber: "#fbbf24",
  overlay: "rgba(20, 17, 14, 0.55)",
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  screen: 18,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const type = {
  kicker: 11,
  body: 15,
  title: 28,
  display: 36,
};

export function statusColor(status: string) {
  if (status === "AVAILABLE" || status === "COMPLETED") return colors.success;
  if (status === "ON_RENT" || status === "ACTIVE") return colors.accent;
  if (status === "MAINTENANCE" || status === "SCHEDULED") return colors.warning;
  if (status === "OUT_OF_SERVICE" || status === "CANCELLED") return colors.danger;
  return colors.muted;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    AVAILABLE: "Available",
    SCHEDULED: "Scheduled",
    ON_RENT: "On rent",
    PICKUP_SCHEDULED: "Pickup scheduled",
    MAINTENANCE: "Maintenance",
    OUT_OF_SERVICE: "Out of service",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    DELIVERY: "Delivery",
    PICKUP: "Pickup",
  };
  return labels[status] || status.replaceAll("_", " ");
}
