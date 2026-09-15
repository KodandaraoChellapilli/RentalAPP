import { Text, View, StyleSheet } from "react-native";
import { colors, radius } from "../theme";
import { Button, Card } from "./ui";

export function SuccessState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.mark}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button label={actionLabel} onPress={onAction} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", paddingVertical: 28 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  check: { color: colors.success, fontSize: 28, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, textAlign: "center" },
  body: { color: colors.muted, textAlign: "center", marginVertical: 12, lineHeight: 22 },
});
