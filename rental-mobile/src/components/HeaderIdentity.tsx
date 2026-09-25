import { Text, View, StyleSheet } from "react-native";
import { useAuth } from "../lib/auth";
import { firstName } from "../lib/format";
import { colors, typeScale } from "../theme";

/** Shows the authenticated user's first name in headers (owner / employee / customer). */
export function HeaderIdentity() {
  const { user } = useAuth();
  const name = firstName(user?.name);
  if (!name) return <View style={styles.spacer} />;

  return (
    <View style={styles.wrap} accessibilityLabel={`Signed in as ${user?.name}`}>
      <Text style={styles.kicker}>Signed in</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { width: 16 },
  wrap: { paddingLeft: 16, maxWidth: 140 },
  kicker: {
    color: colors.muted,
    fontSize: typeScale.kicker,
    fontWeight: "600",
  },
  name: { color: colors.ink, fontWeight: "700", fontSize: 13, marginTop: 1 },
});
