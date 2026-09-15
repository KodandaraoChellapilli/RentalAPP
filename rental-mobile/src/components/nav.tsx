import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "../theme";

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export const tabBarOptions = {
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
  headerStyle: { backgroundColor: colors.ink },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: "700" as const },
};
