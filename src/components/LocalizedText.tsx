import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextProps, type TextInputProps, type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

function scriptStyle(style: StyleProp<TextStyle>) {
  const fontSize = StyleSheet.flatten(style)?.fontSize;
  return {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'normal' as const,
    letterSpacing: 0,
    ...(fontSize ? { lineHeight: Math.ceil(fontSize * 1.5) } : {}),
  };
}
// Only typography changes here; member-authored text is never translated.
export const Text = forwardRef<React.ComponentRef<typeof NativeText>, TextProps & { systemFont?: boolean }>(function Text({ style, systemFont, ...props }, ref) {
  const { i18n } = useTranslation();
  return <NativeText ref={ref} {...props} style={[style, (systemFont || i18n.language !== 'en') && scriptStyle(style)]} />;
});
export const TextInput = forwardRef<React.ComponentRef<typeof NativeTextInput>, TextInputProps>(function TextInput({ style, ...props }, ref) {
  const { i18n } = useTranslation();
  return <NativeTextInput ref={ref} {...props} style={[style, i18n.language !== 'en' && scriptStyle(style)]} />;
});
