import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, radius, scale } from "../theme";

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Text style={[styles.label, selected && styles.labelOn]}>
              {option.label}
              {typeof option.count === "number" ? ` ${option.count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 0, marginBottom: 4 },
  row: { gap: scale(8), paddingBottom: scale(10), paddingRight: 8 },
  chip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: scale(14),
    minHeight: scale(36),
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { color: colors.ink, fontWeight: "600", fontSize: scale(13) },
  labelOn: { color: colors.white },
});
