import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getMedia, makePeer } from './rtc';
import { loadPeerConfiguration } from './relay';
import type { Description, Stream } from './rtc-types';
import { finishCall, readCall, sendCandidate, watchCall, watchCandidates, writeCall } from './signaling';

function permissionError(error: unknown): Error | null {
  const value = error as { name?: string; message?: string };
  if (/NotAllowed|PermissionDenied/.test(value?.name || '') || /permission.*denied/i.test(value?.message || '')) {
    return new Error('Microphone or camera permission was denied. Allow access in settings and try again.');
  }
  if (value?.name === 'NotFoundError') return new Error('No microphone or camera was found. Connect a device and try again.');
  return null;
}

export function connect(
  id: string,
  uid: string,
  events: {
    local: (stream: Stream) => void;
    remote: (stream: Stream) => void;
    status: (status: string) => void;
    error: (error: Error) => void;
    permissionRequest?: (pending: boolean) => void;
  },
) {
  const credentials = new AbortController();
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let stream: Stream | null = null;
  let peer: ReturnType<typeof makePeer> | null = null;
  let stopCall = () => {};
  let stopBlockA = () => {};
  let stopBlockB = () => {};
  let stopCandidates = () => {};
  let answering = false;
  let chain = Promise.resolve();
  const candidates: unknown[] = [];

  const stop = () => {
    if (disposed) return;
    disposed = true;
    credentials.abort();
    clearTimeout(expiry);
    stopCall();
    stopBlockA();
    stopBlockB();
    stopCandidates();
    stream?.getTracks().forEach(track => track.stop());
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
    }
  };

  const fail = (error: unknown) => {
    if (!disposed) {
      stop();
      events.status('ended');
      events.error(permissionError(error) || (error instanceof Error ? error : new Error('The call could not connect.')));
      void finishCall(id).catch(() => {});
    }
  };

  const remoteDescription = async (description: unknown) => {
    if (disposed || !peer || peer.remoteDescription) return;
    await peer.setRemoteDescription(description as Description);
    for (const candidate of candidates.splice(0)) {
      if (disposed) return;
      await peer.addIceCandidate(candidate);
    }
  };

  void (async () => {
    const call = await readCall(id);
    if (![call.callerId, call.calleeId].includes(uid) || !['ringing', 'accepted'].includes(call.status)) {
      throw new Error('This call has ended.');
    }
    if (disposed) return;
    stopCall = watchCall(id, next => {
      if (!disposed && (!next || ['ended', 'declined'].includes(next.status))) {
        stop();
        events.status(next?.status || 'ended');
      }
    }, fail);
    if (db) {
      stopBlockA = onSnapshot(doc(db, 'blocks', `${call.callerId}~${call.calleeId}`), v => {
        if (!disposed && v.exists()) fail(new Error('This call was blocked. Audio and video have stopped.'));
      }, fail);
      stopBlockB = onSnapshot(doc(db, 'blocks', `${call.calleeId}~${call.callerId}`), v => {
        if (!disposed && v.exists()) fail(new Error('This call was blocked. Audio and video have stopped.'));
      }, fail);
    }
    if (disposed) return;
    const configuration = await loadPeerConfiguration({ kind: 'call', id }, credentials.signal);
    if (disposed) return;
    if (configuration.expiresAt) {
      expiry = setTimeout(() => fail(new Error('The call timed out. Please try again.')), Math.max(0, configuration.expiresAt - Date.now() - 60000));
    }
    stream = await getMedia(call.mode === 'video', { permissionRequest: events.permissionRequest, cancelled: () => disposed });
    if (disposed) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }
    events.local(stream);
    peer = makePeer(configuration);
    stream.getTracks().forEach(track => peer!.addTrack(track, stream!));
    peer.ontrack = e => { if (!disposed && e.streams[0]) events.remote(e.streams[0]); };
    peer.onconnectionstatechange = () => {
      if (!disposed && peer) {
        events.status(peer.connectionState);
        if (peer.connectionState === 'failed') fail(new Error('Your network could not connect this call. Try another network.'));
      }
    };
    peer.onicecandidate = e => { if (e.candidate && !disposed) void sendCandidate(id, uid, e.candidate.toJSON()).catch(fail); };
    stopCandidates = watchCandidates(id, uid, candidate => {
      chain = chain.then(async () => {
        if (disposed || !peer) return;
        if (peer.remoteDescription) await peer.addIceCandidate(candidate);
        else candidates.push(candidate);
      }).catch(fail);
    }, fail);
    if (uid === call.callerId) {
      const offer = await peer.createOffer();
      if (disposed) return;
      await peer.setLocalDescription(offer);
      if (disposed) return;
      await writeCall(id, { offer: { type: offer.type, sdp: offer.sdp } });
    } else {
      await writeCall(id, { status: 'accepted' });
    }
    if (disposed) return;
    stopCall();
    stopCall = watchCall(id, next => {
      chain = chain.then(async () => {
        if (disposed || !peer || !next) return;
        if (next.status === 'ended' || next.status === 'declined') {
          stop();
          events.status(next.status);
          return;
        }
        if (uid === next.callerId && next.answer) await remoteDescription(next.answer);
        else if (uid === next.calleeId && next.offer && !answering) {
          answering = true;
          await remoteDescription(next.offer);
          if (disposed) return;
          const answer = await peer.createAnswer();
          if (disposed) return;
          await peer.setLocalDescription(answer);
          if (disposed) return;
          await writeCall(id, { answer: { type: answer.type, sdp: answer.sdp } });
        }
      }).catch(fail);
    }, fail);
  })().catch(fail);

  return stop;
}
