import { auth } from '../lib/firebase';
import { iceServers } from './rtc-types';
import type { IceServer, PeerConfiguration } from './rtc-types';

type RelayContext = { kind: 'call'; id: string };
const failure = () => new Error('The call could not connect.');
const MAX_RESPONSE_BYTES = 65536;
const aborted = () => Object.assign(new Error('Call setup was cancelled.'), { name: 'AbortError' });

function parseConfig(value: unknown): PeerConfiguration {
  const data = value as { iceServers?: unknown; expiresAt?: unknown } | null;
  if (!data || typeof data.expiresAt !== 'number' || !Number.isFinite(data.expiresAt) || data.expiresAt < Date.now() + 120000 || data.expiresAt > Date.now() + 48 * 3600000 || !Array.isArray(data.iceServers) || !data.iceServers.length || data.iceServers.length > 16) throw failure();
  let hasRelay = false;
  const servers: IceServer[] = data.iceServers.map((server: unknown) => {
    const entry = server as IceServer | null;
    if (!entry || typeof entry !== 'object') throw failure();
    const urls = typeof entry.urls === 'string' ? [entry.urls] : entry.urls;
    if (!Array.isArray(urls) || !urls.length || urls.length > 8 || urls.some(url => typeof url !== 'string' || url.length > 512 || !/^(stun|stuns|turn|turns):(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[a-f0-9:]+\])(?::\d{1,5})?(?:\?transport=(?:udp|tcp))?$/i.test(url))) throw failure();
    const relay = urls.some(url => /^turns?:/i.test(url));
    if (relay && (typeof entry.username !== 'string' || !entry.username.trim() || entry.username.length > 4096 || typeof entry.credential !== 'string' || !entry.credential.trim() || entry.credential.length > 4096)) throw failure();
    hasRelay ||= relay;
    return { urls: typeof entry.urls === 'string' ? entry.urls : [...urls], ...(relay ? { username: entry.username, credential: entry.credential } : {}) };
  });
  if (!hasRelay) throw failure();
  return { iceServers: servers, expiresAt: data.expiresAt };
}

export async function loadPeerConfiguration(context: RelayContext, signal?: AbortSignal): Promise<PeerConfiguration> {
  if (signal?.aborted) throw aborted();
  const endpoint = process.env.EXPO_PUBLIC_TURN_CREDENTIALS_URL;
  if (!endpoint) return { iceServers: iceServers() };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 15000);
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || !url.hostname || !context.id || context.id.length > 256) throw failure();
    const user = auth?.currentUser;
    if (!user) throw failure();
    const token = await user.getIdToken();
    if (controller.signal.aborted) throw signal?.aborted ? aborted() : failure();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) throw failure();
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw failure();
    return parseConfig(JSON.parse(text));
  } catch {
    throw signal?.aborted ? aborted() : failure();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
