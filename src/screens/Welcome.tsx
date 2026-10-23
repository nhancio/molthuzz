import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import { BrandMark } from "../components/brand-mark";
import { Badge, Button, Notice } from "../components/UI";
import { LanguagePicker } from "../components/LanguagePicker";
import { colors, shared, type, spacing, radius } from "../theme";

const portraits = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
];

export default function Welcome({ onGoogle, onDemo, onLegal, busy, error }: {
  onGoogle: () => void;
  onDemo: () => void;
  onLegal: (v: "terms" | "privacy") => void;
  busy: boolean;
  error: string;
}) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  return (
    <SafeAreaView style={shared.page}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: "100%", maxWidth: 480, alignSelf: "center", padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg }}
      >
        <View style={[shared.row, { justifyContent: "space-between" }]}>
          <BrandMark size={32} />
          <LanguagePicker compact />
        </View>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm, height: Math.max(160, Math.min(240, height * 0.27)) }}>
            {portraits.map((source, index) => (
              <View key={source} style={{ flex: 1, marginTop: index ? spacing.md : 0, marginBottom: index ? 0 : spacing.md, borderRadius: radius.xl, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.soft }}>
                <Image source={source} contentFit="cover" contentPosition="top" accessibilityLabel={t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")} style={{ width: "100%", height: "100%" }} />
              </View>
            ))}
          </View>
          <Text style={[type.caption, { textAlign: "center" }]}>{t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")}</Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          <Badge>{t("18+ ONLY")}</Badge>
          <Text accessibilityRole="header" style={type.largeTitle}>{t("Less scrolling. More feeling.")}</Text>
          <Text style={type.subhead}>{t("Meet someone who makes the everyday feel a little less ordinary.")}</Text>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Button onPress={onGoogle} busy={busy} icon="logo-google">{t("Continue with Google")}</Button>
          <Button variant="text" onPress={onDemo} disabled={busy}>{t("Explore the demo")}</Button>
          {error ? <Notice text={error} error /> : null}
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.caption, { textAlign: "center" }]}>{t("By continuing, you confirm you’re 18+ and agree to our Terms and Privacy Policy.")}</Text>
          <View style={[shared.row, { justifyContent: "center", gap: spacing.lg }]}>
            <Button variant="text" compact inline onPress={() => onLegal("terms")}>{t("Terms")}</Button>
            <Button variant="text" compact inline onPress={() => onLegal("privacy")}>{t("Privacy Policy")}</Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
