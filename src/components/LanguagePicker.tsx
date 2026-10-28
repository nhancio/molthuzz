import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Host, Picker } from "@expo/ui";
import { useTranslation } from "react-i18next";
import { languages, type LanguagePreference } from "../i18n/language";
import { useLanguage } from "../i18n";
import { colors, shared } from "../theme";
import { Button, IconButton, Notice, Sheet } from "./UI";
import { Text } from "./LocalizedText";

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { preference, busy, error, choose } = useLanguage();
  const [draft, setDraft] = useState<LanguagePreference>(preference);
  const current =
    languages.find(({ code }) => code === i18n.language) || languages[0];
  async function select(value: LanguagePreference) {
    // The context persists first. Failed changes keep this sheet and error visible.
    if (await choose(value)) setOpen(false);
  }
  return (
    <View>
      {compact ? (
        <IconButton
          label={`${t("App language")}: ${current.nativeName}`}
          icon="language-outline"
          disabled={busy}
          onPress={() => {
            setDraft(preference);
            setOpen(true);
          }}
        />
      ) : (
        <Button
          secondary
          icon="language-outline"
          disabled={busy}
          onPress={() => {
            setDraft(preference);
            setOpen(true);
          }}
        >
          {current.nativeName}
        </Button>
      )}
      <Sheet
        title={t("App language")}
        visible={open}
        dismissible={!busy}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <Text style={shared.muted}>
          {t(
            "Choose the language for MakeIn’s interface. Profiles and messages stay as written.",
          )}
        </Text>
        {error ? <Notice error text={error} /> : null}
        <View style={styles.group}>
          <Text style={shared.label}>{t("Language")}</Text>
          <Host
            colorScheme="light"
            seedColor={colors.ink}
            style={{
              height: Platform.OS === "ios" ? 216 : 64,
              alignSelf: "stretch",
            }}
          >
            <Picker<LanguagePreference>
              selectedValue={draft}
              appearance={Platform.OS === "ios" ? "wheel" : "menu"}
              enabled={!busy}
              onValueChange={(value) => {
                if (!busy) setDraft(value);
              }}
            >
              <Picker.Item label={t("Use device language")} value="device" />
              {languages.map(({ code, nativeName }) => (
                <Picker.Item key={code} label={nativeName} value={code} />
              ))}
            </Picker>
          </Host>
          {draft === "device" && (
            <Text style={shared.muted}>
              {t("Matches your phone’s language when supported.")}
            </Text>
          )}
        </View>
        <Button
          secondary
          busy={busy}
          onPress={() => {
            void select(draft);
          }}
        >
          {t("Done")}
        </Button>
      </Sheet>
    </View>
  );
}
const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
});

export default LanguagePicker;
