import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  StyleSheet,
  type TextInputProps,
  View,
} from "react-native";
import { Text, TextInput } from "./LocalizedText";
import {
  Button as NativeButton,
  Checkbox,
  Column,
  Host,
  Row,
  Text as NativeText,
} from "@expo/ui";
import NativeControlIcon from "./native-control-icon";
import {
  NativeBusyIndicator,
  NativeIconAction,
  NativeSingleChoice,
  nativeButtonModifiers,
  nativeButtonContentModifiers,
  nativeChoiceModifiers,
  nativeLabelModifiers,
} from "./native-control-platform";
import { nativeSelectionChange } from "../lib/native-control-state";
import { colors, controlSize, fonts, shared } from "../theme";
import NativeSheet from "./native-sheet";
import { Icon, type IconName } from "./native-icons";
export { Icon } from "./native-icons";
export type { IconName } from "./native-icons";

function nativeButtonLabel(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number")
        return String(child);
      return React.isValidElement<{ children?: React.ReactNode }>(child)
        ? nativeButtonLabel(child.props.children)
        : "";
    })
    .join("");
}
export function Button({
  children,
  onPress,
  secondary,
  disabled,
  busy,
  icon,
  compact = false,
  variant,
  inline = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
  compact?: boolean;
  variant?: "primary" | "secondary" | "text" | "destructive";
  inline?: boolean;
}) {
  const label = nativeButtonLabel(children);
  const blocked = !!(disabled || busy);
  const appearance = variant ?? (secondary ? "secondary" : "primary");
  const filled = appearance === "primary";
  return (
    <Host
      colorScheme="light"
      seedColor={colors.ink}
      ignoreSafeArea="all"
      matchContents={inline ? true : { vertical: true }}
      style={{ alignSelf: inline ? "flex-start" : "stretch", minHeight: controlSize }}
    >
      <NativeButton
        disabled={blocked}
        onPress={() => {
          if (!blocked) onPress();
        }}
        variant={filled ? "filled" : appearance === "secondary" ? "outlined" : "text"}
        modifiers={nativeButtonModifiers(label, compact, appearance, inline)}
      >
        <Row
          alignment="center"
          spacing={9}
          modifiers={nativeButtonContentModifiers(compact, inline)}
        >
          {busy ? (
            <NativeBusyIndicator onFilled={filled} />
          ) : icon ? (
            <NativeControlIcon name={icon} size={20} />
          ) : null}
          <NativeText
            textStyle={{ fontWeight: appearance === "text" ? "400" : "600", textAlign: "center", fontSize: compact ? 15 : 17, color: filled ? colors.white : appearance === "destructive" ? colors.red : colors.ink }}
            modifiers={nativeLabelModifiers(inline)}
          >
            {label}
          </NativeText>
        </Row>
      </NativeButton>
    </Host>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  busy,
  size = 21,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: number;
}) {
  const blocked = !!(disabled || busy);
  return (
    <Host
      colorScheme="light"
      seedColor={colors.ink}
      ignoreSafeArea="all"
      matchContents
      style={{
        minWidth: controlSize,
        minHeight: controlSize,
        alignSelf: "center",
      }}
    >
      <NativeIconAction
        label={label}
        disabled={blocked}
        onPress={() => {
          if (!blocked) onPress();
        }}
      >
        {busy ? (
          <NativeBusyIndicator />
        ) : (
          <NativeControlIcon name={icon} size={size} />
        )}
      </NativeIconAction>
    </Host>
  );
}
export function Field({
  label,
  style,
  onFocus,
  onBlur,
  row = false,
  ...props
}: TextInputProps & { label: string; row?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.field, row && { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 4, paddingBottom: 4 }, focused && { borderColor: colors.ink }]}>
      <Text style={[shared.label, row && { flex: 1, color: colors.ink, fontSize: 16 }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#92998A"
        selectionColor={colors.ink}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[shared.input, row && { flex: 1.5, textAlign: "right" }, style]}
      />
    </View>
  );
}
export function Chips({
  values,
  selected,
  onChange,
  multiple = false,
  disabled = false,
  maxSelected,
}: {
  values: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  maxSelected?: number;
}) {
  const { t } = useTranslation();
  const update = (value: string, checked = true) => {
    const next = nativeSelectionChange({
      values,
      selected,
      value,
      multiple,
      checked,
      disabled,
      maxSelected,
    });
    if (next) onChange(next);
  };
  const current = selected.find((value) => values.includes(value)) ?? "";
  const options = values.map((value) => ({ value, label: t(value) }));
  if (!values.includes(current)) options.unshift({ value: "", label: "" });
  return (
    <Host
      colorScheme="light"
      seedColor={colors.ink}
      ignoreSafeArea="all"
      matchContents={{ vertical: true }}
      style={{ alignSelf: "stretch", minHeight: controlSize }}
    >
      <Column spacing={10} modifiers={nativeChoiceModifiers()}>
        {multiple ? (
          values.map((value) => {
            const checked = selected.includes(value);
            const blocked =
              disabled ||
              (!checked &&
                maxSelected != null &&
                selected.length >= maxSelected);
            return (
              <Checkbox
                key={value}
                value={checked}
                label={t(value)}
                disabled={blocked}
                onValueChange={(next) => update(value, next)}
                modifiers={nativeChoiceModifiers()}
              />
            );
          })
        ) : (
          <NativeSingleChoice
            options={options}
            selected={current}
            onChange={(value) => update(value)}
            disabled={disabled}
          />
        )}
      </Column>
    </Host>
  );
}
export function Badge({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <View style={[s.badge, dark && { backgroundColor: colors.ink }]}>
      <Text style={[s.badgeText, dark && { color: colors.lime }]}>
        {children}
      </Text>
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const displayText = i18n.exists(text, { lng: "en" })
    ? t(text)
    : error
      ? t("Something went wrong. Please try again.")
      : text;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={error ? "assertive" : "polite"}
      style={[s.notice, error && { backgroundColor: "#FAEBE8" }]}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon
          name={error ? "alert-circle-outline" : "information-circle-outline"}
          size={19}
          color={error ? colors.red : colors.ink}
        />
      </View>
      <Text
        selectable
        style={[
          shared.muted,
          { flex: 1, color: error ? colors.red : colors.ink },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}
export function Empty({
  icon = "sparkles-outline",
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Text accessibilityRole="header" style={s.emptyTitle}>
        {title}
      </Text>
      <Text style={[shared.muted, { textAlign: "center", maxWidth: 310 }]}>
        {text}
      </Text>
      {action}
    </View>
  );
}
export function Sheet({
  title,
  visible,
  onClose,
  children,
  dismissible = true,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
}) {
  const { t } = useTranslation();
  // Keep the native sheet mounted through its dismissal animation. The native
  // presenter unmounts its content; it must receive isPresented=false first.
  return (
    <NativeSheet visible={visible} onClose={onClose} dismissible={dismissible}>
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.sheetHeader}>
          <Text accessibilityRole="header" style={s.sheetTitle}>
            {title}
          </Text>
          <IconButton
            icon="close"
            label={t("Close dialog")}
            disabled={!dismissible}
            onPress={onClose}
          />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 20,
            paddingHorizontal: 22,
            paddingTop: 20,
            paddingBottom: 32,
          }}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          {children}
        </ScrollView>
      </View>
    </NativeSheet>
  );
}
export const s = StyleSheet.create({
  field: {
    gap: 1,
    backgroundColor: colors.white,
    borderRadius: 17,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 2,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  badgeText: {
    fontFamily: fonts.semi,
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.3,
    color: colors.ink,
  },
  notice: {
    padding: 16,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 16,
    minHeight: 320,
    padding: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.soft,
    borderRadius: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.semi,
    fontWeight: "600",
    color: colors.ink,
    fontSize: 26,
    lineHeight: 33,
    textAlign: "center",
  },
  sheet: { flex: 1, backgroundColor: colors.paper },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.semi,
    fontWeight: "600",
    fontSize: 25,
    lineHeight: 33,
    color: colors.ink,
  },
});
