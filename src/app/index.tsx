import React from "react";
import { Redirect } from "expo-router";
import { useMakeIn } from "../screens/MakeIn";
export default function Entry() {
  const app = useMakeIn();
  return app.ready ? <Redirect href={app.destination} /> : <>{app.entry}</>;
}
