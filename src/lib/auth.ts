import { GoogleAuthProvider, browserLocalPersistence, deleteUser, onAuthStateChanged, reauthenticateWithCredential, reauthenticateWithPopup, setPersistence, signInWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';
import type { AuthUser } from './contracts';
const requireAuth = () => { if (!auth) throw new Error('Google sign in is not configured yet. Explore the labelled demo while setup is completed.'); return auth; };
export function watchAuth(next: (user: AuthUser | null) => void): () => void {
  if (!auth) { next(null); return () => {}; } return onAuthStateChanged(auth, next);
}
async function nativeCredential() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error('Native Google sign in requires the MakeIn Google web client ID.');
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success' || !result.data.idToken) throw new Error('Google sign in was cancelled.');
  return GoogleAuthProvider.credential(result.data.idToken);
}
export async function signInGoogle(): Promise<void> {
  const instance = requireAuth();
  if (Platform.OS === 'web') { await setPersistence(instance, browserLocalPersistence); await signInWithPopup(instance, new GoogleAuthProvider()); }
  else await signInWithCredential(instance, await nativeCredential());
}
export async function signOutUser(): Promise<void> { await signOut(requireAuth()); }
export async function reauthenticateGoogle(): Promise<void> {
  const user = requireAuth().currentUser; if (!user) throw new Error('Sign in again to continue.');
  if (Platform.OS === 'web') await reauthenticateWithPopup(user, new GoogleAuthProvider());
  else await reauthenticateWithCredential(user, await nativeCredential());
}
export async function deleteAuthUser(): Promise<void> {
  const user = requireAuth().currentUser; if (!user) throw new Error('Sign in again to delete your account.'); await deleteUser(user);
}
