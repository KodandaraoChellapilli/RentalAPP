import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "./ui";
import { colors, radius } from "../theme";
import type { Equipment } from "../types";

export function EquipmentCard({
  item,
  onOpen,
  meta,
}: {
  item: Equipment;
  onOpen: () => void;
  meta?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.stripe, { backgroundColor: stripeFor(item.status) }]} />
      <View style={styles.body}>
        <Badge status={item.status} />
        <Text style={styles.title}>{item.label}</Text>
        <Text style={styles.meta}>{meta || `${item.type} · ${item.rateLabel}`}</Text>
        <Text style={styles.cta}>View history →</Text>
      </View>
    </Pressable>
  );
}

function stripeFor(status: string) {
  if (status === "AVAILABLE") return colors.success;
  if (status === "ON_RENT") return colors.accent;
  if (status === "MAINTENANCE") return colors.warning;
  if (status === "OUT_OF_SERVICE") return colors.danger;
  return colors.muted;
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
  title: { fontWeight: "700", fontSize: 17, marginTop: 8, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  cta: { marginTop: 10, color: colors.accent, fontWeight: "700" },
});
