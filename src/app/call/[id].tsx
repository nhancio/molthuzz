import React from "react";
import { Redirect } from "expo-router";
import { useMakeIn } from "../../screens/MakeIn";
import CallScreen from "../../screens/Call";

export default function CallRoute() {
  const app = useMakeIn();
  if (!app.ready) return <Redirect href="/" />;
  return <CallScreen />;
}
