import React from "react";
import { ActivityIndicator } from "react-native";
import { Button, Picker, type UniversalBaseProps } from "@expo/ui";
import type {
  NativeChoiceProps,
  NativeIconActionProps,
} from "./native-control-platform-types";
// Web-only fallback. Metro resolves the iOS/Android toolkit implementations above.
export function nativeButtonModifiers(
  _label: string,
  _compact: boolean,
): NonNullable<UniversalBaseProps["modifiers"]> {
  return [];
}
export function nativeButtonContentModifiers(
  _compact: boolean,
): NonNullable<UniversalBaseProps["modifiers"]> {
  return [];
}
export function nativeLabelModifiers(): NonNullable<
  UniversalBaseProps["modifiers"]
> {
  return [];
}
export function nativeChoiceModifiers(): NonNullable<
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
