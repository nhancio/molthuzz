import { Platform, StyleSheet } from "react-native";

// A deliberately light, photo-first palette. Keep these strings animation-safe.
export const colors = {
  paper: "#F8F7F2",
  ink: "#20251F",
  muted: "#70776B",
  lime: "#D5F36A",
  line: "#E4E6DC",
  white: "#FFFFFF",
  soft: "#F0F1E9",
  red: "#A83C38",
};
const system = Platform.OS === "ios" ? "System" : "sans-serif";
export const fonts = {
  serif: "InstrumentSerif_400Regular",
  regular: system,
  medium: Platform.OS === "android" ? "sans-serif-medium" : system,
  semi: Platform.OS === "android" ? "sans-serif-medium" : system,
  bold: Platform.OS === "android" ? "sans-serif-bold" : system,
};
export const controlSize = Platform.OS === "ios" ? 44 : 48;
export const shared = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: "row", alignItems: "center" },
  body: {
    fontFamily: fonts.regular,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 49,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.semi,
    fontWeight: "600",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  panel: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: 24,
    borderCurve: "continuous",
    padding: 20,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: controlSize,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
});
