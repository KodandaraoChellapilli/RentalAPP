import { Stack } from "expo-router";
import { HeaderIdentity } from "../../../src/components/HeaderIdentity";
import { SignOutButton } from "../../../src/components/SignOutButton";
import { headerOptions } from "../../../src/theme";

export default function CustomerRentalsLayout() {
  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerBackTitle: "Rentals",
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
