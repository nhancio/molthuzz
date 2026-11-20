import { addDoc, collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Call } from '../lib/contracts';

function database(): Firestore {
  if (!db) throw new Error('Calling requires a live connection.');
  return db;
}

export async function startCall(matchId: string, callerId: string, calleeId: string, mode: 'audio' | 'video'): Promise<string> {
  if (!callerId || !calleeId || callerId === calleeId) throw new Error('Choose a connection to call.');
  const ref = doc(collection(database(), 'calls'));
  await setDoc(ref, { matchId, callerId, calleeId, mode, status: 'ringing', createdAt: Date.now() });
  return ref.id;
}

export function watchCall(id: string, next: (call: Call | null) => void, error: (error: Error) => void): () => void {
  try {
    return onSnapshot(doc(database(), 'calls', id), value => next(value.exists() ? ({ ...value.data(), id: value.id } as Call) : null), error);
  } catch (e) {
    error(e as Error);
    return () => {};
  }
}

export function watchIncoming(uid: string, next: (calls: Call[]) => void, error: (error: Error) => void): () => void {
  try {
    return onSnapshot(
      query(collection(database(), 'calls'), where('calleeId', '==', uid), where('status', '==', 'ringing')),
      values => next(values.docs.map(d => ({ ...d.data(), id: d.id } as Call))),
      error,
    );
  } catch (e) {
    error(e as Error);
    return () => {};
  }
}

export const finishCall = (id: string, status: 'ended' | 'declined' = 'ended') =>
  updateDoc(doc(database(), 'calls', id), { status });

export async function readCall(id: string): Promise<Call> {
  const value = await getDoc(doc(database(), 'calls', id));
  if (!value.exists()) throw new Error('This call is no longer available.');
  return { ...value.data(), id: value.id } as Call;
}

export const writeCall = (id: string, fields: Record<string, unknown>) =>
  updateDoc(doc(database(), 'calls', id), fields);

export const sendCandidate = (id: string, uid: string, candidate: Record<string, unknown>) =>
  addDoc(collection(database(), 'calls', id, 'candidates'), { authorId: uid, candidate });

export function watchCandidates(id: string, uid: string, next: (candidate: unknown) => void, error: (error: Error) => void): () => void {
  return onSnapshot(collection(database(), 'calls', id, 'candidates'), snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' && change.doc.data().authorId !== uid) next(change.doc.data().candidate);
    });
  }, error);
}
