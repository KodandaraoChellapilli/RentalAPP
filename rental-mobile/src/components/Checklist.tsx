import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.dot, item.done && styles.done]}>
            <Text style={[styles.mark, item.done && styles.markDone]}>{item.done ? "✓" : ""}</Text>
          </View>
          <Text style={[styles.label, item.done && styles.labelDone]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  done: { backgroundColor: colors.success, borderColor: colors.success },
  mark: { fontSize: 12, fontWeight: "700", color: colors.muted },
  markDone: { color: colors.white },
  label: { color: colors.ink, fontWeight: "600" },
  labelDone: { color: colors.muted },
});
