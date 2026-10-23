export const languages = [
  { code: 'en', nativeName: 'English', name: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', name: 'Hindi' },
  { code: 'te', nativeName: 'తెలుగు', name: 'Telugu' },
  { code: 'ta', nativeName: 'தமிழ்', name: 'Tamil' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'ml', nativeName: 'മലയാളം', name: 'Malayalam' },
  { code: 'mr', nativeName: 'मराठी', name: 'Marathi' },
  { code: 'bn', nativeName: 'বাংলা', name: 'Bengali' },
  { code: 'gu', nativeName: 'ગુજરાતી', name: 'Gujarati' },
] as const;
export type LanguageCode = typeof languages[number]['code'];
export type LanguagePreference = LanguageCode | 'device';
export const preferenceKey = 'makein.language.v1';
export const isLanguage = (value: unknown): value is LanguageCode => languages.some(({ code }) => code === value);
export function languageFromDevice(tags: readonly string[]): LanguageCode {
  for (const tag of tags) {
    const code = tag.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(code)) return code;
  }
  return 'en';
}
export function resolveLanguage(preference: LanguagePreference, deviceTags: readonly string[]): LanguageCode {
  return preference === 'device' ? languageFromDevice(deviceTags) : preference;
}
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };
export async function loadLanguage(storage: Storage, deviceTags: readonly string[]) {
  const stored = await storage.getItem(preferenceKey);
  const preference: LanguagePreference = isLanguage(stored) ? stored : 'device';
  return { preference, language: resolveLanguage(preference, deviceTags) };
}
export async function persistLanguage(storage: Storage, preference: LanguagePreference, deviceTags: readonly string[]) {
  if (preference !== 'device' && !isLanguage(preference)) throw new Error('Unsupported language');
  await storage.setItem(preferenceKey, preference);
  return { preference, language: resolveLanguage(preference, deviceTags) };
}
