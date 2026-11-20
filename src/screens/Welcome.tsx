import React from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import { BrandMark } from "../components/brand-mark";
import { Button, Notice } from "../components/UI";
import { LanguagePicker } from "../components/LanguagePicker";
import { colors, shared, type, spacing, radius } from "../theme";

const portrait =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80";

export default function Welcome({ onGoogle, onApple, onDemo, onLegal, busy, error }: {
  onGoogle: () => void;
  onApple?: () => void;
  onDemo: () => void;
  onLegal: (v: "terms" | "privacy") => void;
  busy: boolean;
  error: string;
}) {
  const { t } = useTranslation();
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <View style={shared.page}>
      <StatusBar style="light" />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ height: Math.max(180, Math.min(340, height * (fontScale > 1.2 ? 0.25 : 0.36))), backgroundColor: colors.ink }}>
          <Image source={portrait} contentFit="cover" contentPosition="top" accessibilityLabel={t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")} style={StyleSheet.absoluteFill} />
          <LinearGradient pointerEvents="none" colors={["#14181399", "#14181300"]} style={[StyleSheet.absoluteFill, { bottom: "55%" }]} />
          <View style={[shared.row, { justifyContent: "space-between", paddingTop: insets.top + spacing.sm, paddingHorizontal: 20 }]}>
            <BrandMark size={34} color={colors.white} />
            <View style={w.glass}>
              <LanguagePicker compact />
            </View>
          </View>
          <View style={w.caption}>
            <Text style={w.captionText}>{t("Illustrative photo, not a member")}</Text>
          </View>
        </View>
        <View style={[w.panel, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ width: "100%", maxWidth: 480, alignSelf: "center", gap: spacing.lg }}>
            <View style={{ gap: 10 }}>
              <Text style={w.metaLine}>{t("18+ · 9 Indian languages")}</Text>
              <Text accessibilityRole="header" style={[type.display, { fontSize: 34, lineHeight: 38 }]}>{t("Date, make friends, and talk clearly")}</Text>
              <Text style={type.subhead}>{t("Swipe for dating on Home, connect with friends for 1-on-1 calls, keep every chat in one inbox, and practice openers in Learn.")}</Text>
            </View>
            <View style={w.pillars}>
              <View style={w.pillarRow}>
                <View style={w.pillarDot} />
                <Text style={w.pillarText}>{t("Home — swipe thoughtfully and see who liked you")}</Text>
              </View>
              <View style={w.pillarRow}>
                <View style={w.pillarDot} />
                <Text style={w.pillarText}>{t("Friends — meet people and start 1-on-1 audio or video calls")}</Text>
              </View>
              <View style={w.pillarRow}>
                <View style={w.pillarDot} />
                <Text style={w.pillarText}>{t("Learn — practical guides and a private conversation coach")}</Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {process.env.EXPO_OS === "ios" && onApple ? (
                <Button onPress={onApple} busy={busy} icon="lock-closed-outline">{t("Continue with Apple")}</Button>
              ) : null}
              <Button onPress={onGoogle} secondary={process.env.EXPO_OS === "ios" && !!onApple} busy={busy} icon="logo-google">{t("Continue with Google")}</Button>
              <Button secondary onPress={onDemo} disabled={busy}>{t("Explore the demo")}</Button>
              {error ? <Notice text={error} error /> : null}
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { textAlign: "center" }]}>{t("By continuing, you confirm you’re 18+ and agree to our Terms and Privacy Policy.")}</Text>
              <View style={[shared.row, { justifyContent: "center", flexWrap: "wrap", gap: spacing.lg }]}>
                <Button variant="text" compact inline onPress={() => onLegal("terms")}>{t("Terms")}</Button>
                <Button variant="text" compact inline onPress={() => onLegal("privacy")}>{t("Privacy Policy")}</Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const w = StyleSheet.create({
  glass: { backgroundColor: "#FFFFFFE6", borderRadius: 999, overflow: "hidden" },
  caption: {
    position: "absolute",
    left: 20,
    bottom: 32,
    backgroundColor: "#14181399",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  captionText: { ...type.caption, fontSize: 12, lineHeight: 16, color: colors.white },
  metaLine: { ...type.caption, fontSize: 13, color: colors.muted },
  pillars: { gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.soft },
  pillarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pillarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink },
  pillarText: { ...type.body, fontSize: 13, lineHeight: 18, color: colors.ink, flex: 1 },
  // The paper panel overlaps the photo like a magazine fold.
  panel: {
    flexGrow: 1,
    marginTop: -32,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
  },
});
