import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { HeaderIdentity } from "../../src/components/HeaderIdentity";
import { SignOutButton } from "../../src/components/SignOutButton";
import { tabBarOptions, tabIcon } from "../../src/components/nav";

export default function OwnerLayout() {
  const { user, loading } = useAuth();
  if (!loading && (!user || user.role !== "ADMIN")) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        ...tabBarOptions,
        headerLeft: () => <HeaderIdentity />,
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: tabIcon("grid-outline") }} />
      <Tabs.Screen name="rentals" options={{ title: "Rentals", tabBarIcon: tabIcon("calendar-outline") }} />
      <Tabs.Screen name="transports" options={{ title: "Transports", tabBarIcon: tabIcon("car-outline") }} />
      <Tabs.Screen
        name="equipment"
        options={{ title: "Equipment", headerShown: false, tabBarIcon: tabIcon("construct-outline") }}
      />
      <Tabs.Screen name="people" options={{ title: "People", tabBarIcon: tabIcon("people-outline") }} />
      <Tabs.Screen name="reports" options={{ href: null, title: "Reports" }} />
    </Tabs>
  );
}
