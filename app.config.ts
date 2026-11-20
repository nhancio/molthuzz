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
      'expo-image',
      ['expo-splash-screen', {
        backgroundColor: '#F8F7F2',
        image: './assets/icon.png',
        imageWidth: 96,
      }],
      ['expo-localization', {
        supportedLocales: ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu'],
      }],
      ['expo-image-picker', {
        photosPermission: 'Choose your own photos for your MakeIn dating profile.',
        cameraPermission: 'MakeIn uses your camera for profile photos and 1-on-1 video calls with your connections.',
        microphonePermission: 'MakeIn uses your microphone for 1-on-1 audio and video calls with your connections.',
      }],
      'expo-apple-authentication',
      ['@config-plugins/react-native-webrtc', {
        cameraPermission: 'MakeIn uses your camera for 1-on-1 video calls with your connections.',
        microphonePermission: 'MakeIn uses your microphone for 1-on-1 audio and video calls with your connections.',
      }],
      './plugins/withWebRtcR8.cjs',
      ...(iosScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme: iosScheme }] as [string, Record<string, string>]] : []),
    ],
    ios: {
      ...config.ios,
      usesAppleSignIn: true,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSCameraUsageDescription: 'MakeIn uses your camera for 1-on-1 video calls with your connections.',
        NSMicrophoneUsageDescription: 'MakeIn uses your microphone for 1-on-1 audio and video calls with your connections.',
      },
      ...(fs.existsSync('./GoogleService-Info.plist') ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
    android: {
      ...config.android,
      permissions: Array.from(new Set([...(config.android?.permissions || []), 'CAMERA', 'RECORD_AUDIO'])),
      ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
    },
  };
};
