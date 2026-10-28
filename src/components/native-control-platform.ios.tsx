import React from "react";
import { Button, Row } from "@expo/ui";
import { ProgressView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  accessibilityElement,
  buttonBorderShape,
  controlSize,
  fixedSize,
  font,
  frame,
  layoutPriority,
  lineLimit,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { colors } from "../theme";
import type {
  NativeIconActionProps,
} from "./native-control-platform-types";

export function nativeButtonModifiers(label: string, compact: boolean, appearance = "primary", inline = false) {
  return [
    controlSize(compact ? "small" : "large"),
    buttonBorderShape("capsule"),
    tint(appearance === "destructive" ? colors.red : colors.ink),
    frame({ minHeight: compact ? 32 : 50, ...(inline ? {} : { maxWidth: Infinity }) }),
    accessibilityElement("ignore"),
    accessibilityLabel(label),
  ];
}
export function nativeButtonContentModifiers(compact: boolean, inline = false) {
  return [frame({ ...(inline ? {} : { maxWidth: Infinity }), minHeight: compact ? 18 : 26 })];
}
export function nativeLabelModifiers(inline = false, compact = false) {
  return [
    font({ textStyle: compact ? "footnote" : "body", weight: "semibold" }),
    inline || compact ? lineLimit(1) : lineLimit(),
    fixedSize({ horizontal: false, vertical: true }),
    layoutPriority(1),
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
