import { Stack } from "expo-router";
import { SignOutButton } from "../../../src/components/SignOutButton";
import { headerOptions } from "../../../src/theme";

export default function JobsLayout() {
  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerBackTitle: "Transports",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Transports", headerRight: () => <SignOutButton /> }}
      />
      <Stack.Screen name="deliver/[id]" options={{ title: "Delivery" }} />
      <Stack.Screen name="pickup/[id]" options={{ title: "Pickup" }} />
    </Stack>
  );
}
