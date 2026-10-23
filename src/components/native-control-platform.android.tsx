import React from "react";
import { Picker } from "@expo/ui";
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
  NativeChoiceProps,
  NativeIconActionProps,
} from "./native-control-platform-types";

export function nativeButtonModifiers(label: string, _compact: boolean, _appearance = "primary", inline = false) {
  return [
    ...(inline ? [] : [fillMaxWidth()]),
    defaultMinSize({ minWidth: 48, minHeight: 48 }),
    semantics({ contentDescription: label }),
  ];
}
export function nativeButtonContentModifiers(_compact: boolean, _inline = false) {
  return [];
}
export function nativeLabelModifiers(inline = false) {
  return inline ? [] : [weight(1)];
}
export function nativeChoiceModifiers() {
  return [defaultMinSize({ minWidth: 48, minHeight: 48 })];
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
export function NativeSingleChoice({
  options,
  selected,
  onChange,
  disabled,
}: NativeChoiceProps) {
  return (
    <Picker<string>
      selectedValue={selected}
      onValueChange={onChange}
      enabled={!disabled}
      appearance="menu"
    >
      {options.map((option) => (
        <Picker.Item
          key={option.value}
          value={option.value}
          label={option.label}
        />
      ))}
    </Picker>
  );
}
