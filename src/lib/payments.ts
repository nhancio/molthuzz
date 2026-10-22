import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { AuthUser } from './contracts';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
export const paymentConfigured = process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === 'true' && !!apiUrl;

async function membershipRequest(user: AuthUser, route: 'checkout' | 'cancel-membership'): Promise<Record<string, unknown>> {
  if (!paymentConfigured || !apiUrl) throw new Error('Membership payments are not available yet. You can complete your profile and explore the demo.');
  const response = await fetch(`${apiUrl}/.netlify/functions/${route}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await user.getIdToken()}`, 'content-type': 'application/json' },
    body: '{}',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Membership could not be updated. Please try again.');
  return result;
}

export async function startCheckout(user: AuthUser): Promise<void> {
  const result = await membershipRequest(user, 'checkout');
  if (typeof result.url !== 'string' || !result.url.startsWith('https://')) throw new Error('The payment provider did not return a secure checkout link.');
  if (Platform.OS === 'web') window.location.assign(result.url);
  else await WebBrowser.openBrowserAsync(result.url);
  // Closing the browser never proves payment. The screen observes server entitlements via watchMembership.
}

export async function cancelMembership(user: AuthUser): Promise<void> {
  await membershipRequest(user, 'cancel-membership');
}
