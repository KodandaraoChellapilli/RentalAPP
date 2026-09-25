import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = width >= 768 ? 768 : 375;
const guidelineBaseHeight = Platform.OS === "ios" ? (height >= 1024 ? 1024 : 812) : height <= 550 ? 667 : 812;

export const size = { width, height };

export function scale(sizeValue: number) {
  return Math.ceil((width / guidelineBaseWidth) * sizeValue);
}

export function verticalScale(sizeValue: number) {
  return Math.ceil((height / guidelineBaseHeight) * sizeValue);
}

export const isIos = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
