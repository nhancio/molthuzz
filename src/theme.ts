import { Platform, StyleSheet } from "react-native";
export const colors = {
  paper: "#F7F6F0",
  ink: "#20241F",
  muted: "#74796E",
  lime: "#D1F45B",
  line: "#DEDFD5",
  white: "#FFFFFF",
  soft: "#EDEEE5",
  red: "#A83C38",
};
export const fonts = {
  serif: "InstrumentSerif_400Regular",
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semi: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
};
export const shared = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: "row", alignItems: "center" },
  body: {
    fontFamily: fonts.regular,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 48,
    lineHeight: 51,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.bold,
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 2,
  },
  panel: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 24,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 15,
    paddingHorizontal: 2,
    minHeight: 54,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
});
