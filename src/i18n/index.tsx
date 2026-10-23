import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { languageFromDevice, loadLanguage, persistLanguage, resolveLanguage, type LanguagePreference } from './language';
import { resources } from './resources';

const deviceTags = () => getLocales().map(({ languageTag }) => languageTag);
export const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources,
  lng: languageFromDevice(deviceTags()),
  fallbackLng: 'en',
  supportedLngs: Object.keys(resources),
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

const LanguageContext = createContext<{
  preference: LanguagePreference;
  busy: boolean;
  error: string;
  choose: (preference: LanguagePreference) => Promise<boolean>;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preference, setPreference] = useState<LanguagePreference>('device');
  const currentPreference = useRef<LanguagePreference>('device');
  const writing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    loadLanguage(AsyncStorage, deviceTags()).then(async (saved) => {
      if (!mounted) return;
      await i18n.changeLanguage(saved.language);
      if (!mounted) return;
      currentPreference.current = saved.preference;
      setPreference(saved.preference);
    }).catch(() => {
      if (mounted) setError('Language settings could not be loaded. Choose a language to save your preference.');
    }).finally(() => { if (mounted) setReady(true); });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && currentPreference.current === 'device' && !writing.current) {
        void i18n.changeLanguage(resolveLanguage('device', deviceTags()));
      }
    });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  async function choose(next: LanguagePreference) {
    if (writing.current || !ready) return false;
    writing.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await persistLanguage(AsyncStorage, next, deviceTags());
      await i18n.changeLanguage(saved.language);
      currentPreference.current = saved.preference;
      setPreference(saved.preference);
      return true;
    } catch {
      setError('Could not save your language. Please try again.');
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ preference, busy, error, choose }}>
        {ready ? children : null}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider is missing');
  return value;
}
