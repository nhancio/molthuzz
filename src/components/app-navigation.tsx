import React from "react";
import { Pressable, View } from "react-native";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";
import { type AppTab } from "../screens/native-navigation";
import { LanguagePicker } from "./LanguagePicker";
import { Icon } from "./UI";
import { colors } from "../theme";
export function HeaderActions() {
  const { openMembership } = useMakeIn();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Membership")}
        onPress={openMembership}
        hitSlop={4}
        style={({ pressed }) => ({
          minWidth: 44,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.55 : 1,
        })}
      >
        <Icon name="sparkles-outline" size={21} />
      </Pressable>
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
        headerTitleStyle: { fontWeight: "700" },
        headerLargeTitleEnabled:
          process.env.EXPO_OS === "ios" && tab !== "discover",
        headerLargeTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t(title) }} />
    </Stack>
  );
}
export function AppTabScreen({ tab }: { tab: AppTab }) {
  return <>{useMakeIn().renderTab(tab)}</>;
}
