import { Stack } from "expo-router";
import { HeaderIdentity } from "../../../src/components/HeaderIdentity";
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
        contentStyle: { backgroundColor: colors.bg, flex: 1 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "My rentals",
          headerLeft: () => <HeaderIdentity />,
          headerRight: () => <SignOutButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Rental" }} />
    </Stack>
  );
}
