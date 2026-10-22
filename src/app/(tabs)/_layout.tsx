import React from "react";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../../screens/MakeIn";
import { colors } from "../../theme";
export default function TabLayout() {
  const { ready, matchCount } = useMakeIn();
  const { t } = useTranslation();
  if (!ready) return <Redirect href="/" />;
  return (
    <NativeTabs
      tintColor={colors.ink}
      indicatorColor={colors.lime}
      backgroundColor={
        process.env.EXPO_OS === "android" ? colors.paper : undefined
      }
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon
          sf={{ default: "safari", selected: "safari.fill" }}
          md="explore"
        />
        <NativeTabs.Trigger.Label>{t("Discover")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="likes">
        <NativeTabs.Trigger.Icon
          sf={{ default: "heart", selected: "heart.fill" }}
          md="favorite"
        />
        <NativeTabs.Trigger.Label>{t("Likes you")}</NativeTabs.Trigger.Label>
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
        {matchCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {String(matchCount)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="person"
        />
        <NativeTabs.Trigger.Label>{t("You")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
