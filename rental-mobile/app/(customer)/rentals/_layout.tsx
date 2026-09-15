import { Stack } from "expo-router";
import { SignOutButton } from "../../../src/components/SignOutButton";
import { colors } from "../../../src/theme";

export default function CustomerRentalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
        headerBackTitle: "Rentals",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "My rentals", headerRight: () => <SignOutButton /> }}
      />
      <Stack.Screen name="[id]" options={{ title: "Rental" }} />
    </Stack>
  );
}
