import { type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme";
import { Button } from "./ui";

export function Sheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  pending,
  onConfirm,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.kicker}>Confirm</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {children}
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label={cancelLabel} variant="ghost" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                variant={destructive ? "danger" : "primary"}
                pending={pending}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  dim: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: space.lg,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    marginBottom: 12,
  },
  header: {
    backgroundColor: colors.ink,
    marginHorizontal: -space.lg,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  kicker: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: { color: colors.white, fontSize: 20, fontWeight: "700", marginTop: 4 },
  body: { color: colors.muted, lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
});
