import { StyleSheet } from "react-native";
import { colors, radius, scale } from "../../theme";

export const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.loginNavy },
    background: { flex: 1 },
    overlay: { flex: 1 },
    safe: { flex: 1 },
    flex: { flex: 1 },
    content: {
      flexGrow: 1,
      paddingHorizontal: scale(18),
      paddingTop: scale(12),
      paddingBottom: scale(32),
      justifyContent: "center",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: scale(12),
      paddingVertical: scale(12),
    },
    brandName: {
      flex: 1,
      color: colors.white,
      fontSize: scale(22),
      fontWeight: "700",
    },
    textContainer: {
      paddingTop: scale(28),
      marginBottom: scale(8),
    },
    headline: {
      color: colors.white,
      fontSize: scale(26),
      fontWeight: "700",
      letterSpacing: -0.4,
      lineHeight: scale(32),
    },
    inputContainer: {
      rowGap: scale(6),
    },
    buttonContainer: {
      marginTop: scale(16),
      rowGap: scale(14),
    },
    errorBox: {
      marginTop: scale(14),
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: "#fecaca",
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
  });
