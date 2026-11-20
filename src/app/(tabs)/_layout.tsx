import React from "react";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../../screens/MakeIn";
import { colors } from "../../theme";

export default function TabLayout() {
  const { ready } = useMakeIn();
  const { t } = useTranslation();
  if (!ready) return <Redirect href="/" />;
  return (
    <NativeTabs
      tintColor={colors.ink}
      indicatorColor={colors.lime}
      badgeBackgroundColor={colors.ink}
      badgeTextColor={colors.lime}
      backgroundColor={
        process.env.EXPO_OS === "android" ? colors.paper : undefined
      }
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: "flame", selected: "flame.fill" }}
          md="local_fire_department"
        />
        <NativeTabs.Trigger.Label>{t("Home")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md="group"
        />
        <NativeTabs.Trigger.Label>{t("Friends")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="connections">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "bubble.left.and.bubble.right",
            selected: "bubble.left.and.bubble.right.fill",
          }}
          md="chat_bubble"
        />
        <NativeTabs.Trigger.Label>{t("Chats")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Icon
          sf={{ default: "sparkles", selected: "sparkles" }}
          md="auto_awesome"
        />
        <NativeTabs.Trigger.Label>{t("Learn")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="person"
        />
        <NativeTabs.Trigger.Label>{t("Profile")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
