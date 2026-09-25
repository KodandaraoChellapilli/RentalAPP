import { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, scale, typeScale } from "../theme";

type Props = ComponentProps<typeof TextInput> & {
  label?: string;
  hint?: string;
  dark?: boolean;
  isSecure?: boolean;
  onSecurePress?: () => void;
};

export function Field({ label, hint, dark, style, isSecure, onSecurePress, secureTextEntry, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text> : null}
      <View style={[styles.box, dark && styles.boxDark]}>
        <TextInput
          {...rest}
          secureTextEntry={secureTextEntry}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, rest.multiline && styles.multiline, style]}
        />
        {isSecure ? (
          <Pressable onPress={onSecurePress} hitSlop={8} accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}>
            <Ionicons name={secureTextEntry ? "eye-outline" : "eye-off-outline"} size={scale(22)} color={colors.placeholder} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={[styles.hint, dark && styles.hintDark]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: scale(6) },
  label: {
    fontWeight: "600",
    color: colors.muted,
    marginBottom: scale(6),
    fontSize: typeScale.kicker,
  },
  labelDark: { color: "#d6d3d1" },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minHeight: scale(50),
    paddingRight: scale(12),
  },
  boxDark: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: scale(50),
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    color: colors.ink,
    fontSize: scale(15),
  },
  multiline: { minHeight: scale(104), textAlignVertical: "top", paddingTop: 12 },
  hint: { marginTop: 6, color: colors.muted, fontSize: typeScale.caption, lineHeight: 17 },
  hintDark: { color: "#a8a29e" },
});
