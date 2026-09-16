import { Stack } from "expo-router";
import { SignOutButton } from "../../../src/components/SignOutButton";
import { colors } from "../../../src/theme";

export default function JobsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
        headerBackTitle: "Jobs",
        contentStyle: { backgroundColor: colors.bg, flex: 1 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Today's jobs", headerRight: () => <SignOutButton /> }}
      />
      <Stack.Screen name="deliver/[id]" options={{ title: "Delivery" }} />
      <Stack.Screen name="pickup/[id]" options={{ title: "Pickup" }} />
    </Stack>
  );
}
