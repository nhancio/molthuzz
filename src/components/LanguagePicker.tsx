import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languages, type LanguagePreference } from '../i18n/language';
import { useLanguage } from '../i18n';
import { colors, shared } from '../theme';
import { Button, Icon, Notice, Sheet } from './UI';
import { Text } from './LocalizedText';

export default function LanguagePicker() {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { preference, busy, error, choose } = useLanguage();
  const current = languages.find(({ code }) => code === i18n.language) || languages[0];
  async function select(value: LanguagePreference) {
    if (await choose(value)) setOpen(false);
  }
  return (
    <View>
      <View style={{ paddingHorizontal: 18, alignItems: 'flex-end', borderBottomWidth: 1, borderColor: colors.line }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('App language')}: ${current.nativeName}`} onPress={() => setOpen(true)} style={{ minHeight: 44, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: '100%' }}>
          <Icon name="language-outline" size={18} />
          <Text systemFont style={[shared.muted, { flexShrink: 1 }]}>{t('Language')} · {current.nativeName}</Text>
          <Icon name="chevron-down" size={13} />
        </Pressable>
      </View>
      <Sheet title={t('App language')} visible={open} onClose={() => { if (!busy) setOpen(false); }}>
        <Text style={shared.muted}>{t('Choose the language for MakeIn’s interface. Profiles and messages stay as written.')}</Text>
        {error ? <Notice error text={error} /> : null}
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: preference === 'device', disabled: busy }} disabled={busy} onPress={() => select('device')} style={{ paddingVertical: 12, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}><Text style={shared.body}>{t('Use device language')}</Text><Text style={shared.muted}>{t('Matches your phone’s language when supported.')}</Text></View>
          <Icon name={preference === 'device' ? 'radio-button-on' : 'radio-button-off'} />
        </Pressable>
        {languages.map(({ code, nativeName, name }) => (
          <Pressable key={code} accessibilityRole="radio" accessibilityLabel={`${nativeName}, ${name}`} accessibilityState={{ checked: preference === code, disabled: busy }} disabled={busy} onPress={() => select(code)} style={{ minHeight: 56, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.line }}>
            <View style={{ flex: 1, gap: 2 }}><Text systemFont style={[shared.body, { fontSize: 18 }]}>{nativeName}</Text>{code !== 'en' && <Text style={shared.muted}>{name}</Text>}</View>
            <Icon name={preference === code ? 'radio-button-on' : 'radio-button-off'} />
          </Pressable>
        ))}
        <Button secondary busy={busy} onPress={() => setOpen(false)}>{t('Done')}</Button>
      </Sheet>
    </View>
  );
}
