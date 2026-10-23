import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const configured = !!(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = configured ? (getApps().length ? getApp() : initializeApp(config)) : null;
function persistentAuth(): Auth | null {
  if (!app) return null;
  if (Platform.OS === 'web') return getAuth(app);
  try {
    // Firebase's React Native export provides this; web typings omit it.
    const nativeAuth = FirebaseAuth as typeof FirebaseAuth & { getReactNativePersistence: (storage: typeof AsyncStorage) => import('firebase/auth').Persistence };
    return initializeAuth(app, { persistence: nativeAuth.getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}
export const auth = persistentAuth();
export const db = app ? getFirestore(app) : null;
export const storage = app && config.storageBucket ? getStorage(app) : null;
