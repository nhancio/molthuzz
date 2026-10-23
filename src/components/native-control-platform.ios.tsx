import React from "react";
import { Button, Row } from "@expo/ui";
import { Picker, ProgressView, Text } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  accessibilityElement,
  buttonBorderShape,
  controlSize,
  disabled,
  fixedSize,
  font,
  frame,
  layoutPriority,
  lineLimit,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { colors } from "../theme";
import type {
  NativeChoiceProps,
  NativeIconActionProps,
} from "./native-control-platform-types";

export function nativeButtonModifiers(label: string, _compact: boolean, appearance = "primary", inline = false) {
  return [
    controlSize("regular"),
    buttonBorderShape("roundedRectangle", 14),
    tint(appearance === "destructive" ? colors.red : colors.ink),
    frame({ minHeight: 44, ...(inline ? {} : { maxWidth: Infinity }) }),
    accessibilityElement("ignore"),
    accessibilityLabel(label),
  ];
}
export function nativeButtonContentModifiers(compact: boolean, inline = false) {
  return [frame({ ...(inline ? {} : { maxWidth: Infinity }), minHeight: compact ? 20 : 26 })];
}
export function nativeLabelModifiers(_inline = false) {
  return [
    font({ textStyle: "body", weight: "semibold" }),
    lineLimit(),
    fixedSize({ horizontal: false, vertical: true }),
    layoutPriority(1),
  ];
}
export function nativeChoiceModifiers() {
  return [
    frame({ maxWidth: Infinity, minHeight: 44 }),
    font({ textStyle: "body" }),
    fixedSize({ horizontal: false, vertical: true }),
  ];
}
export function NativeBusyIndicator({
  onFilled = false,
}: {
  onFilled?: boolean;
}) {
  return (
    <ProgressView modifiers={[tint(onFilled ? colors.white : colors.ink)]} />
  );
}
export function NativeIconAction({
  children,
  label,
  onPress,
  disabled: isDisabled,
}: NativeIconActionProps) {
  return (
    <Button
      variant="text"
      disabled={isDisabled}
      onPress={onPress}
      modifiers={[accessibilityElement("ignore"), accessibilityLabel(label)]}
    >
      <Row
        alignment="center"
        modifiers={[frame({ minWidth: 44, minHeight: 44 })]}
      >
        {children}
      </Row>
    </Button>
  );
}
export function NativeSingleChoice({
  options,
  selected,
  onChange,
  disabled: isDisabled,
}: NativeChoiceProps) {
  return (
    <Picker<string>
      selection={selected}
      onSelectionChange={onChange}
      modifiers={[
        pickerStyle("menu"),
        controlSize("large"),
        frame({ minHeight: 44, maxWidth: Infinity }),
        disabled(isDisabled),
      ]}
    >
      {options.map((option) => (
        <Text
          key={option.value}
          modifiers={[tag(option.value), font({ textStyle: "body" })]}
        >
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
