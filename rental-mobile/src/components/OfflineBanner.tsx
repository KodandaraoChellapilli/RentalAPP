import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNetwork } from "../lib/network";
import { colors, radius } from "../theme";

export function OfflineBanner() {
  const { online, checking, refresh } = useNetwork();
  if (online) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.body}>
          Can't reach the yard server. Clock and job data will refresh when Wi-Fi is back. Photos still need a connection to upload.
        </Text>
      </View>
      <Pressable onPress={refresh} style={styles.btn} disabled={checking}>
        <Text style={styles.btnText}>{checking ? "…" : "Retry"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.dangerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { color: colors.danger, fontWeight: "700" },
  body: { color: colors.danger, marginTop: 2, fontSize: 12, lineHeight: 16 },
  btn: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 12 },
});
