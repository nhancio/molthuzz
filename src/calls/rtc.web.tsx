import React, { useEffect, useRef } from 'react';
import type { MediaRequestOptions, Peer, PeerConfiguration, Stream } from './rtc-types';

export async function getMedia(video: boolean, options: MediaRequestOptions = {}): Promise<Stream> {
  if (options.cancelled?.()) throw Object.assign(new Error('Call setup was cancelled.'), { name: 'AbortError' });
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Audio and video calling is not supported in this browser.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video }) as unknown as Stream;
  if (options.cancelled?.()) {
    stream.getTracks().forEach(track => track.stop());
    throw Object.assign(new Error('Call setup was cancelled.'), { name: 'AbortError' });
  }
  return stream;
}

export function makePeer(configuration: PeerConfiguration): Peer {
  return new RTCPeerConnection({ iceServers: configuration.iceServers }) as unknown as Peer;
}

export function VideoStream({ stream, local = false }: { stream: Stream; local?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream as unknown as MediaStream;
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={local}
      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: local ? 'scaleX(-1)' : undefined }}
    />
  );
}
