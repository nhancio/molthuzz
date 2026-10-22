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
import { colors, controlSize, fonts, shared } from "../theme";
import NativeSheet from "./native-sheet";
import { Icon, type IconName } from "./native-icons";
export { Icon } from "./native-icons";
export type { IconName } from "./native-icons";

export function Button({ children, onPress, secondary, disabled, busy, icon, compact }: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      android_ripple={{ color: "#20251F14" }}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        compact && { minHeight: controlSize, paddingHorizontal: 18, paddingVertical: 10 },
        disabled && { opacity: 0.42 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : icon ? <Icon name={icon} size={20} /> : null}
      <Text style={s.buttonText}>{children}</Text>
    </Pressable>
  );
}
export function Field({ label, style, onFocus, onBlur, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.field, focused && { borderColor: colors.ink }]}>
      <Text style={shared.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#92998A"
        selectionColor={colors.ink}
        {...props}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[shared.input, style]}
      />
    </View>
  );
}
export function Chips({ values, selected, onChange, multiple = false }: {
  values: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={s.chips}>
      {values.map((v) => (
        <Pressable
          accessibilityRole={multiple ? "checkbox" : "radio"}
          accessibilityState={{ checked: selected.includes(v) }}
          key={v}
          onPress={() => onChange(multiple ? selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v] : [v])}
          android_ripple={{ color: "#20251F14" }}
          style={({ pressed }) => [s.chip, selected.includes(v) && s.selected, pressed && { opacity: 0.7 }]}
        >
          <Text style={[s.chipText, selected.includes(v) && { color: colors.ink }]}>{t(v)}</Text>
          {selected.includes(v) && <Icon name="checkmark" size={16} />}
        </Pressable>
      ))}
    </View>
  );
}
export function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <View style={[s.badge, dark && { backgroundColor: colors.ink }]}>
      <Text style={[s.badgeText, dark && { color: colors.lime }]}>{children}</Text>
    </View>
  );
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  const { t, i18n } = useTranslation();
  const displayText = i18n.exists(text, { lng: "en" }) ? t(text) : error ? t("Something went wrong. Please try again.") : text;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion={error ? "assertive" : "polite"} style={[s.notice, error && { backgroundColor: "#FAEBE8" }]}>
      <View style={{ paddingTop: 2 }}><Icon name={error ? "alert-circle-outline" : "information-circle-outline"} size={19} color={error ? colors.red : colors.ink} /></View>
      <Text selectable style={[shared.muted, { flex: 1, color: error ? colors.red : colors.ink }]}>{displayText}</Text>
    </View>
  );
}
export function Empty({ icon = "sparkles-outline", title, text, action }: {
  icon?: IconName;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Icon name={icon} size={28} /></View>
      <Text accessibilityRole="header" style={s.emptyTitle}>{title}</Text>
      <Text style={[shared.muted, { textAlign: "center", maxWidth: 310 }]}>{text}</Text>
      {action}
    </View>
  );
}
export function Sheet({ title, visible, onClose, children, dismissible = true }: {
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
          <Text accessibilityRole="header" style={s.sheetTitle}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Close dialog")}
            accessibilityState={{ disabled: !dismissible }}
            disabled={!dismissible}
            onPress={onClose}
            style={({ pressed }) => [s.close, !dismissible && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
          ><Icon name="close" size={20} /></Pressable>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 20, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 32 }}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >{children}</ScrollView>
      </View>
    </NativeSheet>
  );
}
export const s = StyleSheet.create({
  button: { backgroundColor: colors.lime, borderRadius: 28, minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, overflow: "hidden" },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  buttonText: { fontFamily: fonts.semi, fontWeight: "600", fontSize: 16, lineHeight: 23, color: colors.ink, flexShrink: 1, textAlign: "center" },
  field: { gap: 1, backgroundColor: colors.white, borderRadius: 17, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: { minHeight: controlSize, maxWidth: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 17, paddingVertical: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 26, backgroundColor: colors.white, overflow: "hidden" },
  selected: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { fontFamily: fonts.medium, fontWeight: "500", lineHeight: 22, color: colors.muted, fontSize: 15, flexShrink: 1 },
  badge: { alignSelf: "flex-start", backgroundColor: colors.lime, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, maxWidth: "100%" },
  badgeText: { fontFamily: fonts.semi, fontWeight: "600", fontSize: 11, lineHeight: 17, letterSpacing: 0.3, color: colors.ink },
  notice: { padding: 16, backgroundColor: colors.soft, borderRadius: 16, borderCurve: "continuous", flexDirection: "row", alignItems: "flex-start", gap: 10 },
  empty: { alignItems: "center", justifyContent: "center", flex: 1, gap: 16, minHeight: 320, padding: 24 },
  emptyIcon: { width: 64, height: 64, alignItems: "center", justifyContent: "center", backgroundColor: colors.soft, borderRadius: 32, marginBottom: 4 },
  emptyTitle: { fontFamily: fonts.semi, fontWeight: "600", color: colors.ink, fontSize: 26, lineHeight: 33, textAlign: "center" },
  sheet: { flex: 1, backgroundColor: colors.paper },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, paddingBottom: 16, paddingHorizontal: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  sheetTitle: { flex: 1, fontFamily: fonts.semi, fontWeight: "600", fontSize: 25, lineHeight: 33, color: colors.ink },
  close: { width: controlSize, height: controlSize, borderRadius: controlSize / 2, backgroundColor: colors.soft, alignItems: "center", justifyContent: "center" },
});
