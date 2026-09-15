import { Pressable, Text, View, StyleSheet } from "react-native";
import { colors, radius } from "../theme";
import { Badge } from "./ui";
import { formatWhen } from "../lib/format";
import type { Job } from "../types";

export function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const pickup = job.type === "PICKUP";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pickup ? "Open pickup inspection" : "Open delivery inspection"}
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.stripe, { backgroundColor: pickup ? colors.warning : colors.accent }]} />
      <View style={styles.body}>
        <Badge status={job.type} />
        <Text style={styles.title}>{job.equipment?.label || job.title}</Text>
        <Text style={styles.meta}>{job.customer?.name}</Text>
        <Text style={styles.meta}>{job.destination || "No destination yet"}</Text>
        <Text style={styles.meta}>{formatWhen(job.startAt)}</Text>
        <Text style={styles.cta}>{pickup ? "Open pickup" : "Open delivery"} →</Text>
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
  title: { fontWeight: "700", fontSize: 18, marginTop: 8, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  cta: { marginTop: 12, color: colors.accent, fontWeight: "700" },
});
