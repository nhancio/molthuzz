import React from "react";
import {
  CircularProgressIndicator,
  IconButton,
} from "@expo/ui/jetpack-compose";
import {
  defaultMinSize,
  fillMaxWidth,
  semantics,
  size,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { colors } from "../theme";
import type {
  NativeIconActionProps,
} from "./native-control-platform-types";

export function nativeButtonModifiers(label: string, compact: boolean, _appearance = "primary", inline = false) {
  return [
    ...(inline ? [] : [fillMaxWidth()]),
    defaultMinSize({ minWidth: compact ? 36 : 48, minHeight: compact ? 34 : 52 }),
    semantics({ contentDescription: label }),
  ];
}
export function nativeButtonContentModifiers(_compact: boolean, _inline = false) {
  return [];
}
export function nativeLabelModifiers(inline = false, _compact = false) {
  return inline ? [] : [weight(1)];
}
export function NativeBusyIndicator({
  onFilled = false,
}: {
  onFilled?: boolean;
}) {
  return (
    <CircularProgressIndicator
      color={onFilled ? colors.white : colors.ink}
      modifiers={[size(20, 20)]}
    />
  );
}
export function NativeIconAction({
  children,
  label,
  onPress,
  disabled,
}: NativeIconActionProps) {
  return (
    <IconButton
      enabled={!disabled}
      onClick={onPress}
      modifiers={[
        defaultMinSize({ minWidth: 48, minHeight: 48 }),
        semantics({ contentDescription: label }),
      ]}
    >
      {children}
    </IconButton>
  );
}
