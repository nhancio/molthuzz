export interface Track { kind: string; enabled: boolean; stop(): void }
export interface Stream { getTracks(): Track[]; getAudioTracks(): Track[]; getVideoTracks(): Track[]; toURL?(): string }
export interface MediaRequestOptions { permissionRequest?(pending: boolean): void; cancelled?(): boolean }
export interface IceServer { urls: string | string[]; username?: string; credential?: string }
export interface PeerConfiguration { iceServers: IceServer[]; expiresAt?: number }
export interface Description { type: string; sdp: string }
export interface Peer {
  connectionState: string;
  remoteDescription: Description | null;
  onicecandidate: ((event: { candidate: { toJSON(): Record<string, unknown> } | null }) => void) | null;
  ontrack: ((event: { streams: Stream[] }) => void) | null;
  onconnectionstatechange: (() => void) | null;
  addTrack(track: Track, stream: Stream): unknown;
  createOffer(): Promise<Description>;
  createAnswer(): Promise<Description>;
  setLocalDescription(value: Description): Promise<void>;
  setRemoteDescription(value: Description): Promise<void>;
  addIceCandidate(value: unknown): Promise<void>;
  close(): void;
}
export function iceServers(): IceServer[] {
  const servers: IceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const url = process.env.EXPO_PUBLIC_TURN_URL;
  if (process.env.NODE_ENV !== 'production' && url) {
    servers.push({ urls: url, username: process.env.EXPO_PUBLIC_TURN_USERNAME, credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL });
  }
  return servers;
}
