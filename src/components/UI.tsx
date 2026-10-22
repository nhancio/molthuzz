import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, shared } from "../theme";
export function Icon({
  name,
  size = 21,
  color = colors.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  children,
  onPress,
  secondary,
  disabled,
  busy,
  icon,
  compact,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        compact && { minHeight: 44, paddingHorizontal: 18 },
        (disabled || busy) && { opacity: 0.45 },
        pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.ink} />
      ) : icon ? (
        <Icon name={icon} size={19} />
      ) : null}
      <Text style={s.buttonText}>{children}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={shared.label}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor="#9A9D93"
        style={shared.input}
        {...props}
      />
    </View>
  );
}
export function Chips({
  values,
  selected,
  onChange,
  multiple = false,
}: {
  values: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
}) {
  return (
    <View style={s.chips}>
      {values.map((v) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected.includes(v) }}
          key={v}
          onPress={() =>
            onChange(
              multiple
                ? selected.includes(v)
                  ? selected.filter((x) => x !== v)
                  : [...selected, v]
                : [v],
            )
          }
          style={[s.chip, selected.includes(v) && s.selected]}
        >
          <Text
            style={[s.chipText, selected.includes(v) && { color: colors.ink }]}
          >
            {v}
          </Text>
          {selected.includes(v) && <Icon name="checkmark" size={15} />}
        </Pressable>
      ))}
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
  return (
    <View
      accessibilityRole="alert"
      style={[s.notice, error && { backgroundColor: "#F8E8E4" }]}
    >
      <Icon
        name={error ? "alert-circle-outline" : "information-circle-outline"}
        size={18}
        color={error ? colors.red : colors.ink}
      />
      <Text
        style={[
          shared.muted,
          { flex: 1, color: error ? colors.red : colors.ink },
        ]}
      >
        {text}
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
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Text
        style={[
          shared.heading,
          { fontSize: 35, lineHeight: 39, textAlign: "center" },
        ]}
      >
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
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Unmount closed dialogs so web modal transition state cannot retain focus or overlays.
  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View
            style={[
              shared.row,
              { justifyContent: "space-between", marginBottom: 22 },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                shared.heading,
                { fontSize: 34, lineHeight: 38, flex: 1 },
              ]}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={onClose}
              style={s.close}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 20, paddingBottom: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  button: {
    backgroundColor: colors.lime,
    borderRadius: 32,
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 25,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonText: { fontFamily: fonts.semi, fontSize: 14, color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 30,
  },
  selected: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { fontFamily: fonts.medium, color: colors.muted, fontSize: 14 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    color: colors.ink,
    textTransform: "uppercase",
  },
  notice: {
    padding: 15,
    backgroundColor: colors.soft,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 17,
    minHeight: 350,
    padding: 26,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lime,
    borderRadius: 34,
    marginBottom: 5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#20241F80",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "90%",
    backgroundColor: colors.paper,
    borderRadius: 26,
    padding: 26,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
});
