import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, type ColorValue } from "react-native";
import { colors, headerOptions } from "../theme";

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={name} color={color} size={focused ? size : size - 1} />
  );
}

export const tabBarOptions = {
  tabBarActiveTintColor: colors.ink,
  tabBarInactiveTintColor: colors.placeholder,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "600" as const,
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
  ...headerOptions,
  sceneStyle: { backgroundColor: colors.bg, flex: 1 },
  sceneContainerStyle: { backgroundColor: colors.bg, flex: 1 },
};
