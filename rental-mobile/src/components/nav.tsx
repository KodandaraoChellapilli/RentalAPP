import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, type ColorValue } from "react-native";
import { colors } from "../theme";

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export const tabBarOptions = {
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "700" as const,
    marginBottom: Platform.OS === "ios" ? 0 : 4,
  },
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
  },
  headerStyle: { backgroundColor: colors.ink },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
  headerShadowVisible: false,
  sceneStyle: { backgroundColor: colors.bg, flex: 1 },
  sceneContainerStyle: { backgroundColor: colors.bg, flex: 1 },
};
