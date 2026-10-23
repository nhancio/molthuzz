import React, { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

function scriptStyle(style: StyleProp<TextStyle>, script: boolean): TextStyle {
  const flattened = StyleSheet.flatten(style);
  const fontSize = flattened?.fontSize ?? 16;
  return {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontStyle: "normal",
    ...(script
      ? {
          letterSpacing: 0,
          // Indian scripts need room above and below the Latin baseline.
          lineHeight: Math.max(flattened?.lineHeight ?? 0, Math.ceil(fontSize * 1.5)),
        }
      : {}),
  };
}
// Typography changes only: member-authored text is never translated.
export const Text = forwardRef<
  React.ComponentRef<typeof NativeText>,
  TextProps & { systemFont?: boolean }
>(function Text({ style, systemFont, ...props }, ref) {
  const { i18n } = useTranslation();
  const script = i18n.language.split("-")[0] !== "en";
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[style, (systemFont || script) && scriptStyle(style, script)]}
    />
  );
});
export const TextInput = forwardRef<
  React.ComponentRef<typeof NativeTextInput>,
  TextInputProps
>(function TextInput({ style, ...props }, ref) {
  const { i18n } = useTranslation();
  const script = i18n.language.split("-")[0] !== "en";
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      style={[style, scriptStyle(style, script)]}
    />
  );
});
