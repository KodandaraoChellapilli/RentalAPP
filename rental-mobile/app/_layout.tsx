import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/lib/auth";
import { NetworkProvider } from "../src/lib/network";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </NetworkProvider>
    </AuthProvider>
  );
}
