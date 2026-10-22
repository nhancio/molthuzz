import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import { BrandMark } from "../components/brand-mark";
import { Badge, Button, Notice } from "../components/UI";
import { LanguagePicker } from "../components/LanguagePicker";
import { colors, fonts, shared } from "../theme";

const portrait =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80";

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
  return (
    <SafeAreaView style={shared.page}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 20,
          gap: 22,
        }}
      >
        <View
          style={[
            shared.row,
            { justifyContent: "space-between", minHeight: 48 },
          ]}
        >
          <BrandMark size={34} />
          <LanguagePicker compact />
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          <Badge>{t("18+ ONLY")}</Badge>
          <Text
            accessibilityRole="header"
            systemFont
            style={{
              fontFamily: fonts.bold,
              fontWeight: "700",
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: -0.7,
              color: colors.ink,
            }}
          >
            {t("Less scrolling. More feeling.")}
          </Text>
          <Text
            style={[
              shared.body,
              { color: colors.muted, fontSize: 15, lineHeight: 22 },
            ]}
          >
            {t(
              "Meet someone who makes the everyday feel a little less ordinary.",
            )}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Button onPress={onGoogle} busy={busy} icon="logo-google">
            {t("Continue with Google")}
          </Button>
          <Button secondary onPress={onDemo} disabled={busy}>
            {t("Explore the demo")}
          </Button>
          {error ? <Notice text={error} error /> : null}
        </View>

        <View style={{ gap: 4 }}>
          <Text
            style={[
              shared.muted,
              { fontSize: 12, lineHeight: 18, textAlign: "center" },
            ]}
          >
            {t(
              "By continuing, you confirm you’re 18+ and agree to our Terms and Privacy Policy.",
            )}
          </Text>
          <View
            style={[
              shared.row,
              { justifyContent: "center", flexWrap: "wrap", columnGap: 12 },
            ]}
          >
            {(["terms", "privacy"] as const).map((kind) => (
              <Pressable
                key={kind}
                accessibilityRole="link"
                onPress={() => onLegal(kind)}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={[
                    shared.muted,
                    {
                      fontSize: 12,
                      color: colors.ink,
                      textDecorationLine: "underline",
                    },
                  ]}
                >
                  {t(kind === "terms" ? "Terms" : "Privacy Policy")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginTop: "auto", gap: 6 }}>
          <View
            style={{
              height: 132,
              borderRadius: 20,
              borderCurve: "continuous",
              overflow: "hidden",
              backgroundColor: colors.soft,
            }}
          >
            <Image
              source={portrait}
              contentFit="cover"
              contentPosition={{ top: "28%", left: "50%" }}
              accessibilityLabel={t(
                "ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES",
              )}
              style={{ width: "100%", height: "100%" }}
            />
            <LinearGradient
              colors={["transparent", "rgba(15, 25, 17, 0.65)"]}
              style={{
                position: "absolute",
                inset: 0,
                justifyContent: "flex-end",
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontWeight: "500",
                  fontSize: 18,
                  lineHeight: 24,
                  color: colors.white,
                }}
              >
                {t("The good kind of butterflies.")}
              </Text>
            </LinearGradient>
          </View>
          <Text
            style={[
              shared.muted,
              { fontSize: 9, lineHeight: 14, textAlign: "center" },
            ]}
          >
            {t("ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
