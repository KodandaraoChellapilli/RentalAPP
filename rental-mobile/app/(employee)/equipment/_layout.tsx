import { Stack } from "expo-router";
import { headerOptions } from "../../../src/theme";

export default function EmployeeEquipmentLayout() {
  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerBackTitle: "Equipment",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Equipment" }} />
      <Stack.Screen name="[id]" options={{ title: "Machine" }} />
    </Stack>
  );
}
