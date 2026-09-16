import { Platform, StyleSheet, type ViewStyle } from "react-native";

/** Ridgeline Rentals design tokens — aligned with admin-ui / website palette. */
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
  caption: 12,
  body: 15,
  subtitle: 14,
  title: 26,
  display: 34,
};

export const shadow = Platform.select({
  ios: {
    card: {
      shadowColor: "#1c1917",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    } satisfies ViewStyle,
  },
  default: {
    card: { elevation: 2 } satisfies ViewStyle,
  },
})!;

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

export function stripeForEquipmentStatus(status: string) {
  if (status === "AVAILABLE") return colors.success;
  if (status === "ON_RENT") return colors.accent;
  if (status === "MAINTENANCE") return colors.warning;
  if (status === "OUT_OF_SERVICE") return colors.danger;
  return colors.muted;
}

/** Shared card chrome used by EquipmentCard, JobCard, RentalCard. */
export const cardStyles = StyleSheet.create({
  stripeCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
    ...shadow.card,
  },
  stripe: { width: 5 },
  stripeBody: { flex: 1, padding: space.md },
  cardTitle: { fontWeight: "700", fontSize: 17, marginTop: 8, color: colors.ink },
  cardMeta: { color: colors.muted, marginTop: 3, fontSize: type.subtitle, lineHeight: 20 },
  cardCta: { marginTop: 10, color: colors.accent, fontWeight: "700", fontSize: type.subtitle },
});
