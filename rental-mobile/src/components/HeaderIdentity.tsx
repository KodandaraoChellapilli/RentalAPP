import { Text, View, StyleSheet } from "react-native";
import { useAuth } from "../lib/auth";
import { firstName } from "../lib/format";
import { colors, type } from "../theme";

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
  wrap: { paddingLeft: 16, maxWidth: 120 },
  kicker: {
    color: colors.amber,
    fontSize: type.kicker,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: { color: colors.white, fontWeight: "700", fontSize: 13, marginTop: 1 },
});
