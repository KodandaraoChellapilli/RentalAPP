import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "./ui";
import { formatWhen } from "../lib/format";
import { colors, radius } from "../theme";
import type { Rental } from "../types";

export function RentalCard({
  rental,
  onOpen,
  mode = "active",
}: {
  rental: Rental;
  onOpen: () => void;
  mode?: "active" | "history";
}) {
  const estimate = rental.charge.isEstimate;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open rental ${rental.equipment?.label || ""}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.stripe, { backgroundColor: mode === "active" ? colors.accent : colors.success }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Badge status={rental.status} />
          <View style={[styles.amountPill, estimate ? styles.est : styles.final]}>
            <Text style={[styles.amountPillText, estimate ? styles.estText : styles.finalText]}>
              {estimate ? "Estimate" : "Final"}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>{rental.equipment?.label}</Text>
        <Text style={styles.amount}>
          {rental.charge.formatted}
          {estimate ? " estimated" : ""}
        </Text>
        <Text style={styles.meta}>
          {mode === "active"
            ? `Pickup ${formatWhen(rental.expectedPickupAt)}`
            : `Returned ${formatWhen(rental.endAt)}`}
        </Text>
        {rental.destination ? <Text style={styles.meta}>{rental.destination}</Text> : null}
        <Text style={styles.cta}>View details →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
  },
  stripe: { width: 6 },
  body: { flex: 1, padding: 16 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { fontWeight: "700", fontSize: 17, marginTop: 8, color: colors.ink },
  amount: { marginTop: 6, fontWeight: "700", fontSize: 16, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  cta: { marginTop: 10, color: colors.accent, fontWeight: "700" },
  amountPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  est: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  final: { backgroundColor: colors.successBg, borderColor: colors.success },
  amountPillText: { fontSize: 11, fontWeight: "700" },
  estText: { color: colors.warning },
  finalText: { color: colors.success },
});
