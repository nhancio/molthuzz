import fs from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClient = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const iosScheme = iosClient?.endsWith('.apps.googleusercontent.com')
    ? `com.googleusercontent.apps.${iosClient.replace('.apps.googleusercontent.com', '')}`
    : undefined;
  return {
    ...config,
    name: 'MakeIn',
    slug: 'makein',
    plugins: [
      ...(config.plugins || []),
      ['expo-localization', {
        supportedLocales: ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu'],
      }],
      ['expo-image-picker', {
        photosPermission: 'Choose your own photos for your MakeIn dating profile.',
        cameraPermission: false,
        microphonePermission: false,
      }],
      ...(iosScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme: iosScheme }] as [string, Record<string, string>]] : []),
    ],
    ios: { ...config.ios, ...(fs.existsSync('./GoogleService-Info.plist') ? { googleServicesFile: './GoogleService-Info.plist' } : {}) },
    android: { ...config.android, ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}) },
  };
};
