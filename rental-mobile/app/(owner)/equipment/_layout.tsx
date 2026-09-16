import { Stack } from "expo-router";
import { colors } from "../../../src/theme";

export default function EquipmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
        headerBackTitle: "Fleet",
        contentStyle: { backgroundColor: colors.bg, flex: 1 },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Equipment" }} />
      <Stack.Screen name="[id]" options={{ title: "Machine" }} />
    </Stack>
  );
}
