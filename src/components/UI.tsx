import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextInputProps,
  View,
} from "react-native";
import { Text, TextInput } from "./LocalizedText";
import {
  Button as NativeButton,
  Host,
  Row,
  Text as NativeText,
} from "@expo/ui";
import NativeControlIcon from "./native-control-icon";
import {
  NativeBusyIndicator,
  NativeIconAction,
  nativeButtonModifiers,
  nativeButtonContentModifiers,
  nativeLabelModifiers,
} from "./native-control-platform";
import { nativeSelectionChange } from "../lib/native-control-state";
import { colors, controlSize, fonts, shared, spacing, radius, type } from "../theme";
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
          spacing={compact ? 6 : 9}
          modifiers={nativeButtonContentModifiers(compact, inline)}
        >
          {busy ? (
            <NativeBusyIndicator onFilled={filled} />
          ) : icon ? (
            <NativeControlIcon name={icon} size={compact ? 16 : 20} />
          ) : null}
          <NativeText
            textStyle={{ fontWeight: appearance === "text" ? "400" : "600", textAlign: "center", fontSize: compact ? 13 : 17, color: filled ? colors.white : appearance === "destructive" ? colors.red : colors.ink }}
            modifiers={nativeLabelModifiers(inline, compact)}
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
// Large round actions (swipe decisions, send). Tone sets the editorial fill.
export function CircleButton({
  icon,
  label,
  onPress,
  disabled,
  busy,
  size = 56,
  tone = "white",
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: number;
  tone?: "white" | "lime" | "soft";
}) {
  const blocked = !!(disabled || busy);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: !!busy }}
      disabled={blocked}
      onPress={onPress}
      hitSlop={Math.max(0, (controlSize - size) / 2)}
      style={({ pressed }) => [
        s.circle,
        s[tone],
        { width: size, height: size, borderRadius: size / 2 },
        { opacity: disabled && !busy ? 0.4 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Icon name={icon} size={Math.round(size * 0.4)} />
      )}
    </Pressable>
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
    <View style={[s.field, row && { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 10, paddingBottom: 10 }, focused && { borderColor: colors.ink }]}>
      <Text style={[shared.label, row && { flex: 1, color: colors.ink, fontSize: 16, lineHeight: 22 }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
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
        style={[shared.input, row && { flex: 1.5, textAlign: "right", paddingVertical: 0, minHeight: 28 }, style]}
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
  return (
    <View accessibilityRole={multiple ? undefined : "radiogroup"} style={s.chips}>
      {values.map((value) => {
        const checked = selected.includes(value);
        const blocked =
          disabled ||
          (multiple && !checked && maxSelected != null && selected.length >= maxSelected);
        // Single choice reads as a confident ink pill; multiple selections glow lime.
        const chosen = checked && !multiple;
        return (
          <Pressable
            key={value}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked, disabled: blocked }}
            disabled={blocked}
            onPress={() => {
              const next = nativeSelectionChange({ values, selected, value, multiple, checked: !checked, disabled, maxSelected });
              if (next) onChange(next);
            }}
            style={({ pressed }) => [
              s.chip,
              checked && (multiple ? s.chipOn : s.chipChosen),
              { opacity: blocked && !checked ? 0.45 : pressed ? 0.75 : 1 },
            ]}
          >
            {chosen ? <Icon name="checkmark" size={15} color={colors.lime} /> : null}
            <Text style={[s.chipText, checked && { fontWeight: "600" }, chosen && { color: colors.white }]}>
              {t(value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
      <Text style={[s.badgeText, dark && { color: colors.white }]}>
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
// Initial placeholders keep the shape of known content; refresh leaves content mounted.
export function CollectionFeedback({ loading, error, hasContent, onRetry, height, kind = "rows", columns = 2 }: {
  loading: boolean;
  error: string;
  hasContent: boolean;
  onRetry: () => void;
  height?: number;
  kind?: "rows" | "likes" | "messages";
  columns?: number;
}) {
  const { t } = useTranslation();
  if (error) return <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
    <Notice error text={error} />
    <Button secondary compact busy={loading} onPress={onRetry}>{t("Try again")}</Button>
  </View>;
  if (!loading) return null;
  if (hasContent) return <ActivityIndicator accessibilityLabel={t("Loading…")} color={colors.ink} style={{ padding: spacing.sm }} />;
  return <View accessible accessibilityLabel={t("Loading…")} accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={{ gap: spacing.md, paddingVertical: spacing.md }}>
    {height ? <View style={{ height, backgroundColor: colors.soft, borderRadius: radius.xl, borderCurve: "continuous" }} /> : kind === "likes" ? <View style={{ flexDirection: "row", gap: spacing.row }}>
      {Array.from({ length: columns }, (_, index) => <View key={index} style={{ flex: 1, height: 250, borderRadius: radius.xl, backgroundColor: colors.soft }} />)}
    </View> : kind === "messages" ? [0, 1, 2].map(index => <View key={index} style={{ alignSelf: index % 2 ? "flex-end" : "flex-start", width: index === 1 ? "50%" : "65%", height: 48, borderRadius: radius.lg, backgroundColor: colors.soft }} />) : [0, 1, 2].map(row => <View key={row} style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
      <View style={{ width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.soft }} />
      <View style={{ flex: 1, gap: spacing.sm }}><View style={{ height: 16, width: "55%", borderRadius: radius.sm, backgroundColor: colors.soft }} /><View style={{ height: 12, width: "80%", borderRadius: radius.sm, backgroundColor: colors.soft }} /></View>
    </View>)}
  </View>;
}
export function Empty({
  icon = "information-circle-outline",
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
        {Platform.OS === "ios" && (
          <View accessible={false} style={s.sheetGrabberWrap}>
            <View style={s.sheetGrabber} />
          </View>
        )}
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
            paddingHorizontal: spacing.inset,
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
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.xs,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: "100%",
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
  notice: {
    padding: 16,
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
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
    borderRadius: radius.full,
    marginBottom: 4,
  },
  emptyTitle: {
    ...type.title,
    textAlign: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: controlSize,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 17,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipChosen: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: {
    fontFamily: fonts.medium,
    fontWeight: "500",
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  circle: { alignItems: "center", justifyContent: "center" },
  white: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,

  },
  lime: { backgroundColor: colors.lime },
  soft: { backgroundColor: colors.soft },
  sheet: { flex: 1, backgroundColor: colors.paper },
  sheetGrabberWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 2,
  },
  sheetGrabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: spacing.inset,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sheetTitle: {
    flex: 1,
    ...type.title,
  },
});
