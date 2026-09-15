import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={styles.item}>
            <View style={[styles.dot, done && styles.done, active && styles.active]}>
              <Text style={[styles.dotText, (done || active) && { color: colors.white }]}>
                {done ? "✓" : index + 1}
              </Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {step}
            </Text>
            {index < steps.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 16 },
  item: { flex: 1, alignItems: "center" },
  dot: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  done: { backgroundColor: colors.success },
  active: { backgroundColor: colors.accent },
  dotText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  label: { marginTop: 6, fontSize: 11, color: colors.muted, fontWeight: "600" },
  labelActive: { color: colors.ink },
  line: {
    position: "absolute",
    top: 13,
    left: "60%",
    right: "-40%",
    height: 2,
    backgroundColor: colors.line,
  },
  lineDone: { backgroundColor: colors.success },
});
