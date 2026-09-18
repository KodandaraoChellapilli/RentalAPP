import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { HeaderIdentity } from "../../src/components/HeaderIdentity";
import { SignOutButton } from "../../src/components/SignOutButton";
import { tabBarOptions, tabIcon } from "../../src/components/nav";

export default function EmployeeLayout() {
  const { user, loading } = useAuth();
  if (!loading && (!user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN"))) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        ...tabBarOptions,
        headerLeft: () => <HeaderIdentity />,
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tabs.Screen name="clock" options={{ title: "Clock", tabBarIcon: tabIcon("time-outline") }} />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Transports",
          headerShown: false,
          tabBarIcon: tabIcon("briefcase-outline"),
        }}
      />
      <Tabs.Screen name="equipment" options={{ title: "Equipment", tabBarIcon: tabIcon("construct-outline") }} />
    </Tabs>
  );
}
