import { Text, StyleSheet } from "react-native";
import { colors } from "../theme";
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button label={actionLabel} onPress={onAction} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 20 },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  body: { color: colors.muted, marginVertical: 10, lineHeight: 21 },
});
