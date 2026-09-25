import { View } from "react-native";
import { scale } from "../theme";

export const renderMarginBottom = (value: number) => <View style={{ marginBottom: scale(value || 0) }} />;
export const renderMarginTop = (value: number) => <View style={{ marginTop: scale(value || 0) }} />;
export const renderFlexView = () => <View style={{ flex: 1 }} />;
