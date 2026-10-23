import React from "react";
import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";
import { conversationFallback } from "../screens/native-navigation";
import { IconButton } from "../components/UI";
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
            <IconButton
              label={t("Conversation safety options")}
              icon="ellipsis-horizontal"
              onPress={app.conversationSafety}
            />
          ),
        }}
      />
      {app.renderConversation()}
    </>
  );
}
