import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { tabBarOptions, tabIcon } from "../../src/components/nav";

export default function CustomerLayout() {
  const { user, loading } = useAuth();
  if (!loading && (!user || (user.role !== "CUSTOMER" && user.role !== "ADMIN"))) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ ...tabBarOptions }}>
      <Tabs.Screen
        name="rentals"
        options={{
          title: "My rentals",
          headerShown: false,
          tabBarIcon: tabIcon("file-tray-outline"),
        }}
      />
    </Tabs>
  );
}
