import React from "react";
import { ActivityIndicator } from "react-native";
import { Button, type UniversalBaseProps } from "@expo/ui";
import type {
  NativeIconActionProps,
} from "./native-control-platform-types";
// Web-only fallback. Metro resolves the iOS/Android toolkit implementations above.
export function nativeButtonModifiers(
  _label: string,
  _compact: boolean,
  _appearance = "primary",
  _inline = false,
): NonNullable<UniversalBaseProps["modifiers"]> {
  return [];
}
export function nativeButtonContentModifiers(
  _compact: boolean,
  _inline = false,
): NonNullable<UniversalBaseProps["modifiers"]> {
  return [];
}
export function nativeLabelModifiers(_inline = false, _compact = false): NonNullable<
  UniversalBaseProps["modifiers"]
> {
  return [];
}
export function NativeBusyIndicator({
  onFilled = false,
}: {
  onFilled?: boolean;
}) {
  return <ActivityIndicator color={onFilled ? "#FFFFFF" : "#20251F"} />;
}
export function NativeIconAction({
  children,
  label,
  onPress,
  disabled,
}: NativeIconActionProps) {
  return (
    <Button variant="text" label={label} onPress={onPress} disabled={disabled}>
      {children}
    </Button>
  );
}
