import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";
import { type AppTab } from "../screens/native-navigation";
import { LanguagePicker } from "./LanguagePicker";
import { IconButton } from "./UI";
import { colors, fonts } from "../theme";
export function HeaderActions() {
  const { openMembership } = useMakeIn();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <IconButton
        label={t("Membership")}
        icon="sparkles-outline"
        onPress={openMembership}
      />
      <LanguagePicker compact />
    </View>
  );
}
export function AppTabStack({ tab }: { tab: AppTab }) {
  const { t } = useTranslation();
  const title = {
    discover: "Discover",
    likes: "Likes you",
    matches: "Chats",
    profile: "You",
  }[tab];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        contentStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 24, fontWeight: "400" },
        // Discover keeps a compact title so the card gets the height.
        headerLargeTitleEnabled: tab !== "discover",
        headerLargeTitleStyle: { fontFamily: fonts.serif, fontSize: 42, fontWeight: "400" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t(title) }} />
    </Stack>
  );
}
export function AppTabScreen({ tab }: { tab: AppTab }) {
  return <>{useMakeIn().renderTab(tab)}</>;
}
