import { View, StyleSheet } from "react-native";
import { colors, scale } from "../theme";

/** Orange ridge mark already used on the website — not a new logo. */
export function BrandMark({ size = scale(38) }: { size?: number }) {
  const peak = size * 0.34;
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: peak,
          borderRightWidth: peak,
          borderBottomWidth: size * 0.42,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "#fff7ed",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: scale(7),
    overflow: "hidden",
  },
});
