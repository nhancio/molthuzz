import React from "react";
import { Platform, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import { colors } from "../theme";

type MaterialName = React.ComponentProps<typeof MaterialIcons>["name"];
export const nativeIconNames = {
  "alert-circle-outline": ["exclamationmark.circle", "error-outline"],
  "information-circle-outline": ["info.circle", "info-outline"],
  "sparkles-outline": ["sparkles", "auto-awesome"],
  sparkles: ["sparkles", "auto-awesome"],
  checkmark: ["checkmark", "check"],
  "checkmark-circle-outline": ["checkmark.circle", "check-circle-outline"],
  close: ["xmark", "close"],
  "chevron-forward": ["chevron.right", "chevron-right"],
  "chevron-back": ["chevron.left", "chevron-left"],
  "chevron-down": ["chevron.down", "keyboard-arrow-down"],
  "arrow-forward": ["arrow.right", "arrow-forward"],
  "arrow-back": ["arrow.left", "arrow-back"],
  "arrow-up": ["arrow.up", "arrow-upward"],
  "arrow-up-right-box": ["arrow.up.right.square", "open-in-new"],
  "language-outline": ["globe", "language"],
  "radio-button-on": ["checkmark.circle.fill", "radio-button-checked"],
  "radio-button-off": ["circle", "radio-button-unchecked"],
  "location-outline": ["mappin.and.ellipse", "location-on"],
  "options-outline": ["slider.horizontal.3", "tune"],
  "person-outline": ["person", "person-outline"],
  person: ["person.fill", "person"],
  heart: ["heart.fill", "favorite"],
  "heart-outline": ["heart", "favorite-border"],
  "chatbubble-ellipses-outline": ["message", "chat-bubble-outline"],
  "chatbubbles-outline": ["bubble.left.and.bubble.right", "forum"],
  "ellipsis-horizontal": ["ellipsis", "more-horiz"],
  "create-outline": ["square.and.pencil", "edit"],
  "image-outline": ["photo", "image"],
  "flag-outline": ["flag", "outlined-flag"],
  "ban-outline": ["nosign", "block"],
  "shield-checkmark-outline": ["checkmark.shield", "verified-user"],
  "lock-closed-outline": ["lock", "lock-outline"],
  "document-text-outline": ["doc.text", "description"],
  "compass-outline": ["safari", "explore"],
  "settings-outline": ["gearshape", "settings"],
  "log-out-outline": ["rectangle.portrait.and.arrow.right", "logout"],
  "trash-outline": ["trash", "delete-outline"],
  "camera-outline": ["camera", "photo-camera"],
  add: ["plus", "add"],
} as const satisfies Record<string, readonly [SFSymbol, MaterialName]>;

export type IconName = keyof typeof nativeIconNames | "logo-google";
export function Icon({
  name,
  size = 21,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  // Google has no SF Symbol. Its initial is recognizable without an unrelated glyph.
  if (name === "logo-google") {
    return (
      <Text
        accessible={false}
        style={{
          fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
          fontSize: size,
          lineHeight: size * 1.2,
          fontWeight: "700",
          color,
        }}
      >
        G
      </Text>
    );
  }
  const [sf, material] = nativeIconNames[name];
  return Platform.OS === "ios" ? (
    <SymbolView
      accessible={false}
      name={sf}
      tintColor={color}
      weight="medium"
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  ) : (
    <MaterialIcons
      accessible={false}
      name={material}
      size={size}
      color={color}
    />
  );
}
