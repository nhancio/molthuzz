import React from "react";
import { Platform } from "react-native";
import { Icon as NativeIcon, Text as NativeText } from "@expo/ui";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { nativeIconNames, type IconName } from "./native-icons";

/** Native toolkit children only; Android shares the root-preloaded Material font. */
export default function NativeControlIcon({
  name,
  size = 21,
}: {
  name: IconName;
  size?: number;
}) {
  if (name === "logo-google")
    return (
      <NativeText textStyle={{ fontSize: size, fontWeight: "700" }}>
        G
      </NativeText>
    );
  const [sf, material] = nativeIconNames[name];
  if (Platform.OS === "ios") return <NativeIcon name={sf} size={size} />;
  const glyph = MaterialIcons.glyphMap[material];
  return (
    <NativeText
      textStyle={{ fontFamily: MaterialIcons.getFontFamily(), fontSize: size }}
    >
      {typeof glyph === "number" ? String.fromCodePoint(glyph) : glyph}
    </NativeText>
  );
}
