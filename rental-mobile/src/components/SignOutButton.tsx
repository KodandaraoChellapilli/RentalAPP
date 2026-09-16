import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "../lib/auth";
import { colors } from "../theme";
import { Sheet } from "./Sheet";

export function SignOutButton() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    setOpen(false);
    logout();
  }, [logout]);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.press} hitSlop={10} accessibilityRole="button">
        <Text style={styles.label}>Sign out</Text>
      </Pressable>
      <Sheet
        visible={open}
        title="Sign out?"
        body="You will need to sign in again before clocking or completing a job."
        confirmLabel="Sign out"
        destructive
        onClose={close}
        onConfirm={confirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  press: { paddingHorizontal: 16, minHeight: 44, justifyContent: "center" },
  label: { color: colors.amber, fontWeight: "700", fontSize: 14 },
});
