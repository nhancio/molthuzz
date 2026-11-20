import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";
import { type AppTab } from "../screens/native-navigation";
import { LanguagePicker } from "./LanguagePicker";
import { IconButton } from "./UI";
import { colors, fonts } from "../theme";

export function HeaderActions({ showLikes = false }: { showLikes?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { incomingCount } = useMakeIn();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {showLikes ? (
        <View>
          <IconButton
            icon={incomingCount > 0 ? "heart" : "heart-outline"}
            label={t("Likes you")}
            onPress={() => router.push("/likes")}
          />
        </View>
      ) : null}
      <LanguagePicker compact />
    </View>
  );
}

export function AppTabStack({ tab }: { tab: AppTab }) {
  const { t } = useTranslation();
  const title = {
    home: "Home",
    friends: "Friends",
    matches: "Chats",
    learn: "Learn",
    profile: "Profile",
  }[tab];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        contentStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions showLikes={tab === "home"} />,
        headerTitleStyle: { fontFamily: fonts.semi, fontSize: 17, fontWeight: "600" },
        // Home keeps a compact title so the dating card gets maximum vertical height.
        headerLargeTitleEnabled: tab !== "home" && tab !== "learn",
        headerLargeTitleStyle: { fontFamily: fonts.bold, fontSize: 34, fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t(title) }} />
    </Stack>
  );
}

export function AppTabScreen({ tab }: { tab: AppTab }) {
  return <>{useMakeIn().renderTab(tab)}</>;
}
