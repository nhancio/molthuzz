import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import React from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Button, Notice } from "../components/UI";
import { LanguagePicker } from "../components/LanguagePicker";
import { colors, fonts, shared } from "../theme";

const portrait =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=85";

export default function Welcome({
  onGoogle,
  onDemo,
  onLegal,
  busy,
  error,
}: {
  onGoogle: () => void;
  onDemo: () => void;
  onLegal: (v: "terms" | "privacy") => void;
  busy: boolean;
  error: string;
}) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={shared.page}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        paddingHorizontal: 22,
        paddingTop: process.env.EXPO_OS === "android" ? insets.top : 0,
        paddingBottom: Math.max(insets.bottom, 20),
        gap: 22,
      }}
    >
      <View style={[shared.row, { justifyContent: "space-between", minHeight: 64 }]}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 34, letterSpacing: -1.4, color: colors.ink }}>
          makein<Text style={{ color: "#7D922F" }}>✳</Text>
        </Text>
        <LanguagePicker compact />
      </View>

      <View style={{ gap: 9 }}>
        <View
          style={{
            height: Math.min(282, Math.max(178, height * 0.27)),
            borderRadius: 26,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: colors.soft,
          }}
        >
          <Image
            source={portrait}
            contentFit="cover"
            contentPosition={{ top: "30%", left: "50%" }}
            accessibilityLabel={t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")}
            style={{ width: "100%", height: "100%" }}
          />
          <LinearGradient
            colors={["transparent", "rgba(15, 25, 17, 0.65)"]}
            style={{ position: "absolute", inset: 0, justifyContent: "flex-end", padding: 20 }}
          >
            <Text style={{ fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: "#FFFFFF" }}>
              {t("The good kind of butterflies.")}
            </Text>
          </LinearGradient>
          <View style={{ position: "absolute", top: 15, left: 15 }}>
            <Badge>{t("18+ ONLY")}</Badge>
          </View>
        </View>
        <Text style={[shared.muted, { fontSize: 10, lineHeight: 15, textAlign: "center" }]}>
          {t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.serif, fontSize: 39, lineHeight: 43, letterSpacing: -0.8, color: colors.ink }}>
          {t("Less scrolling. More feeling.")}
        </Text>
        <Text style={[shared.body, { color: colors.muted }]}>
          {t("Meet someone who makes the everyday feel a little less ordinary.")}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Button onPress={onGoogle} busy={busy} icon="logo-google">
          {t("Continue with Google")}
        </Button>
        <Button secondary onPress={onDemo} disabled={busy} icon="arrow-forward">
          {t("Explore the demo")}
        </Button>
        {error ? <Notice text={error} error /> : null}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={[shared.muted, { fontSize: 12, lineHeight: 18, textAlign: "center" }]}>
          {t("By continuing, you confirm you’re 18+ and agree to our Terms and Privacy Policy.")}
        </Text>
        <View style={[shared.row, { justifyContent: "center", flexWrap: "wrap", columnGap: 12 }]}>
          {(["terms", "privacy"] as const).map((kind) => (
            <Pressable
              key={kind}
              accessibilityRole="link"
              onPress={() => onLegal(kind)}
              style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 8 }}
            >
              <Text style={[shared.muted, { color: colors.ink, textDecorationLine: "underline" }]}>
                {t(kind === "terms" ? "Terms" : "Privacy Policy")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[shared.muted, { fontSize: 11, lineHeight: 17, textAlign: "center" }]}>
          {t("Planned membership: ₹2 first calendar month, then ₹99/month. Auto-renews; cancel anytime. Payments are not active yet.")}
        </Text>
      </View>
    </ScrollView>
  );
}
