import React from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import type { MediaRequestOptions, Peer, PeerConfiguration, Stream } from './rtc-types';

// Loaded lazily when a user joins a call so Expo Go can still run every other screen.
function rtc() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-webrtc') as typeof import('react-native-webrtc');
  } catch {
    throw new Error('Calling requires the MakeIn native build. Open the installed app build to use your microphone and camera.');
  }
}

export async function getMedia(video: boolean, options: MediaRequestOptions = {}): Promise<Stream> {
  const cancelled = () => options.cancelled?.() || (Platform.OS === 'android' && AppState.currentState !== 'active');
  const abort = () => Object.assign(new Error('Call setup was cancelled.'), { name: 'AbortError' });
  if (cancelled()) throw abort();
  if (Platform.OS === 'android') {
    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, ...(video ? [PermissionsAndroid.PERMISSIONS.CAMERA] : [])];
    const granted = await Promise.all(permissions.map(permission => PermissionsAndroid.check(permission)));
    if (cancelled()) throw abort();
    const missing = permissions.filter((_permission, index) => !granted[index]);
    if (missing.length) {
      options.permissionRequest?.(true);
      try {
        const result = await PermissionsAndroid.requestMultiple(missing);
        if (missing.some(permission => result[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
          throw new Error('Microphone or camera permission was denied. Allow access in settings and try again.');
        }
      } finally {
        options.permissionRequest?.(false);
      }
    }
    if (cancelled()) throw abort();
  }
  const stream = await rtc().mediaDevices.getUserMedia({
    audio: true,
    video: video ? { facingMode: 'user', width: 640, height: 480, frameRate: 24 } : false,
  }) as unknown as Stream;
  if (cancelled()) {
    stream.getTracks().forEach(track => track.stop());
    throw abort();
  }
  return stream;
}

export function makePeer(configuration: PeerConfiguration): Peer {
  return new (rtc().RTCPeerConnection)({ iceServers: configuration.iceServers }) as unknown as Peer;
}

export function VideoStream({ stream, local = false }: { stream: Stream; local?: boolean }) {
  const RTCView = rtc().RTCView;
  return <RTCView streamURL={stream.toURL?.() || ''} mirror={local} zOrder={local ? 1 : 0} objectFit="cover" style={{ width: '100%', height: '100%' }} />;
}
