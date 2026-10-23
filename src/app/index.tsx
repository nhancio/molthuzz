import React from "react";
import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { useMakeIn } from "../screens/MakeIn";
export default function Entry() {
  const app = useMakeIn();
  return <><Stack.Screen options={{ headerShown: app.settingUp }} />{app.ready ? <Redirect href={app.destination} /> : app.entry}</>;
}
