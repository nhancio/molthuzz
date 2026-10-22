import React from "react";
import { Pressable } from "react-native";
import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";
import { conversationFallback } from "../screens/native-navigation";
import { Icon } from "../components/UI";
export default function Conversation() {
  const app = useMakeIn();
  const { t } = useTranslation();
  const fallback = conversationFallback(app.ready, app.hasConversation);
  if (fallback) return <Redirect href={fallback} />;
  return (
    <>
      <Stack.Screen
        options={{
          title: app.conversationTitle,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Conversation safety options")}
              onPress={app.conversationSafety}
              hitSlop={6}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="ellipsis-horizontal" />
            </Pressable>
          ),
        }}
      />
      {app.renderConversation()}
    </>
  );
}
