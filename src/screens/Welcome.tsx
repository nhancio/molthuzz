import React from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import { BrandMark } from "../components/brand-mark";
import { Badge, Button, Notice } from "../components/UI";
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
            <Text style={w.captionText}>{t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")}</Text>
          </View>
        </View>
        <View style={[w.panel, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ width: "100%", maxWidth: 480, alignSelf: "center", gap: spacing.lg }}>
            <View style={{ gap: 12 }}>
              <Badge>{t("18+ ONLY")}</Badge>
              <Text accessibilityRole="header" style={[type.display, { fontSize: 36, lineHeight: 40 }]}>{t("Meet someone through what you share")}</Text>
              <Text style={type.subhead}>{t("Share your interests, discover profiles and chat when you both like each other.")}</Text>
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
  captionText: { ...type.caption, fontSize: 12, lineHeight: 18, color: colors.white },
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
