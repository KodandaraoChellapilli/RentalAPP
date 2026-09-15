import { type ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius } from "../theme";

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  hint?: string;
  dark?: boolean;
};

export function Field({ label, hint, dark, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={dark ? "#a8a29e" : colors.muted}
        style={[styles.input, dark && styles.inputDark, rest.multiline && styles.multiline, style]}
      />
      {hint ? <Text style={[styles.hint, dark && styles.labelDark]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontWeight: "700", color: colors.ink, marginBottom: 6 },
  labelDark: { color: "#e7e5e4" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.sm,
    minHeight: 50,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: colors.white,
    borderWidth: 0,
  },
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
  hint: { marginTop: 6, color: colors.muted, fontSize: 12 },
});
