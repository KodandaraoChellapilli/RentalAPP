import { Text, View, StyleSheet } from "react-native";
import { Badge } from "./ui";
import { StripeCard } from "./StripeCard";
import { cardStyles, colors, radius, scale } from "../theme";
import { formatWhen } from "../lib/format";
import type { Job } from "../types";

export function JobCard({
  job,
  onOpen,
  featured = false,
}: {
  job: Job;
  onOpen: () => void;
  featured?: boolean;
}) {
  const pickup = job.type === "PICKUP";
  const action = job.completedAt
    ? "View history"
    : pickup
      ? featured
        ? "Start pickup"
        : "Open pickup"
      : featured
        ? "Start delivery"
        : "Open delivery";

  return (
    <StripeCard
      stripeColor={pickup ? colors.warning : colors.accent}
      onPress={onOpen}
      accessibilityLabel={action}
    >
      <View style={styles.top}>
        <Badge status={job.type} />
        {featured ? <Text style={styles.next}>Up next</Text> : null}
      </View>
      <Text style={cardStyles.cardTitle} numberOfLines={2}>
        {job.equipment?.label || job.title}
      </Text>
      <Text style={cardStyles.cardMeta} numberOfLines={1}>
        {job.customer?.name}
      </Text>
      <Text style={cardStyles.cardMeta} numberOfLines={2}>
        {job.destination || "No destination yet"}
      </Text>
      <Text style={cardStyles.cardMeta}>{formatWhen(job.startAt)}</Text>
      {job.statusLabel ? <Text style={cardStyles.cardMeta}>{job.statusLabel}</Text> : null}
      <Text style={cardStyles.cardMeta}>{job.employee?.name ? job.employee.name : "Unassigned"}</Text>
      {job.source === "CUSTOMER" ? <Text style={cardStyles.cardMeta}>Customer requested pickup</Text> : null}
      <View style={[styles.cta, featured && styles.ctaPrimary]}>
        <Text style={[styles.ctaText, featured && styles.ctaPrimaryText]}>{action}</Text>
      </View>
    </StripeCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  next: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  cta: {
    marginTop: 12,
    minHeight: scale(50),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    backgroundColor: colors.button,
    borderColor: colors.button,
  },
  ctaText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  ctaPrimaryText: { color: colors.white },
});
