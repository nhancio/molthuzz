import { Platform, StyleSheet } from "react-native";

// A deliberately light, photo-first palette. Keep these strings animation-safe.
export const colors = {
  paper: "#F8F7F2",
  ink: "#20251F",
  muted: "#63695E",
  lime: "#D5F36A",
  olive: "#7D922F",
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
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;
export const type = {
  largeTitle: { fontFamily: fonts.bold, fontWeight: "700", fontSize: 32, lineHeight: 37, letterSpacing: -0.7, color: colors.ink },
  title: { fontFamily: fonts.semi, fontWeight: "600", fontSize: 22, lineHeight: 29, color: colors.ink },
  headline: { fontFamily: fonts.semi, fontWeight: "600", fontSize: 17, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink },
  subhead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
  // Editorial voice: Instrument Serif for display and section titles, tracked caps for eyebrows.
  display: { fontFamily: fonts.serif, fontSize: 46, lineHeight: 48, letterSpacing: -0.8, color: colors.ink },
  serifTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, color: colors.ink },
  eyebrow: { fontFamily: fonts.semi, fontWeight: "600", fontSize: 11, lineHeight: 15, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted },
} as const;
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
