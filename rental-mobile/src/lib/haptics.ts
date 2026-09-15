import { Platform, Vibration } from "react-native";

export function tapFeedback() {
  if (Platform.OS === "web") return;
  Vibration.vibrate(12);
}

export function successFeedback() {
  if (Platform.OS === "web") return;
  Vibration.vibrate([0, 20, 40, 20]);
}

export function warnFeedback() {
  if (Platform.OS === "web") return;
  Vibration.vibrate([0, 30, 40, 30]);
}
