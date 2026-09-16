import { StyleSheet, Text, View } from "react-native";
import { Badge } from "./ui";
import { StripeCard } from "./StripeCard";
import { cardStyles, colors, radius } from "../theme";
import { formatWhen } from "../lib/format";
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
    <StripeCard
      stripeColor={mode === "active" ? colors.accent : colors.success}
      onPress={onOpen}
      accessibilityLabel={`Open rental ${rental.equipment?.label || ""}`}
    >
      <View style={styles.top}>
        <Badge status={rental.status} />
        <View style={[styles.amountPill, estimate ? styles.est : styles.final]}>
          <Text style={[styles.amountPillText, estimate ? styles.estText : styles.finalText]}>
            {estimate ? "Estimate" : "Final"}
          </Text>
        </View>
      </View>
      <Text style={cardStyles.cardTitle}>{rental.equipment?.label}</Text>
      <Text style={styles.amount}>
        {rental.charge.formatted}
        {estimate ? " estimated" : ""}
      </Text>
      <Text style={cardStyles.cardMeta}>
        {mode === "active"
          ? `Pickup ${formatWhen(rental.expectedPickupAt)}`
          : `Returned ${formatWhen(rental.endAt)}`}
      </Text>
      {rental.destination ? <Text style={cardStyles.cardMeta}>{rental.destination}</Text> : null}
      <Text style={cardStyles.cardCta}>View details →</Text>
    </StripeCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  amount: { marginTop: 6, fontWeight: "700", fontSize: 16, color: colors.ink },
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
