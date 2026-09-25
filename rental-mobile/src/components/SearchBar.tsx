import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, scale } from "../theme";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={scale(18)} color={colors.placeholder} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={8} accessibilityLabel="Clear search" style={styles.clear}>
          <Ionicons name="close-circle" size={scale(18)} color={colors.placeholder} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    height: scale(50),
    paddingRight: scale(10),
    marginBottom: scale(12),
  },
  icon: { marginLeft: scale(14) },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: scale(10),
    fontSize: scale(15),
    color: colors.ink,
  },
  clear: { padding: scale(4) },
});
