import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors, radius, typeScale } from "../theme";
import { formatDateLabel, formatTimeLabel } from "../lib/format";

export function DateTimeField({
  label,
  mode,
  value,
  onChange,
}: {
  label: string;
  mode: "date" | "time";
  value: Date;
  onChange: (next: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = mode === "date" ? formatDateLabel(value) : formatTimeLabel(value);

  function onPick(_event: DateTimePickerEvent, next?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (next) onChange(next);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.input} accessibilityRole="button">
        <Text style={styles.value}>{display}</Text>
      </Pressable>
      {open ? (
        <View>
          <DateTimePicker
            value={value}
            mode={mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPick}
          />
          {Platform.OS === "ios" ? (
            <Pressable onPress={() => setOpen(false)} style={styles.done} accessibilityRole="button">
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 6,
    fontSize: typeScale.kicker,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    minHeight: 50,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  value: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  done: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  doneText: { color: colors.accent, fontWeight: "700" },
});
