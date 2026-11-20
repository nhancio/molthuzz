import React from "react";
import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { useTranslation } from "react-i18next";
import { useMakeIn } from "../screens/MakeIn";

export default function LikesRoute() {
  const app = useMakeIn();
  const { t } = useTranslation();
  if (!app.ready) return <Redirect href="/" />;
  return (
    <>
      <Stack.Screen options={{ title: t("Likes you") }} />
      {app.renderLikes()}
    </>
  );
}
