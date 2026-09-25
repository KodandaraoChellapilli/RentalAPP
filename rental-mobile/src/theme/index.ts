import { StyleSheet } from "react-native";
import { colors } from "./colors";
import { scale } from "./scale";

export { colors } from "./colors";
export { isAndroid, isIos, scale, size, verticalScale } from "./scale";

export const space = {
  xs: scale(6),
  sm: scale(10),
  md: scale(16),
  lg: scale(18),
  xl: scale(24),
  screen: scale(18),
};

export const radius = {
  sm: scale(10),
  md: scale(12),
  lg: scale(16),
  pill: 999,
};

export const typeScale = {
  kicker: scale(12),
  caption: scale(12),
  body: scale(15),
  subtitle: scale(14),
  title: scale(26),
  display: scale(28),
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
    NEEDS_TRANSPORT: "Needs transport",
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

export const cardStyles = StyleSheet.create({
  stripeCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: scale(12),
  },
  stripe: { width: 4 },
  stripeBody: { flex: 1, padding: scale(14) },
  cardTitle: { fontWeight: "700", fontSize: scale(16), marginTop: scale(6), color: colors.ink },
  cardMeta: { color: colors.muted, marginTop: 3, fontSize: typeScale.subtitle, lineHeight: scale(20) },
  cardCta: { marginTop: scale(10), color: colors.accent, fontWeight: "600", fontSize: typeScale.subtitle },
});

export const headerOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17, color: colors.ink },
  headerShadowVisible: false,
  headerBackTitle: "Back",
  contentStyle: { backgroundColor: colors.bg, flex: 1 },
};
