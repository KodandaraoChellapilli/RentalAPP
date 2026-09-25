import { Stack } from "expo-router";
import { headerOptions } from "../../../src/theme";

export default function EquipmentLayout() {
  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerBackTitle: "Fleet",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Equipment" }} />
      <Stack.Screen name="[id]" options={{ title: "Machine" }} />
    </Stack>
  );
}
