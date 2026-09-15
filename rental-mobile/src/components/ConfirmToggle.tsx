import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export function ConfirmToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={[styles.row, value && styles.on]}>
      <View style={[styles.box, value && styles.boxOn]}>
        <Text style={styles.check}>{value ? "✓" : ""}</Text>
      </View>
      <Text style={[styles.label, value && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  on: { backgroundColor: colors.successBg, borderColor: colors.success },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.success, borderColor: colors.success },
  check: { color: colors.white, fontWeight: "700" },
  label: { flex: 1, color: colors.ink, fontWeight: "600" },
  labelOn: { color: colors.success },
});
