import { collection, deleteDoc, doc, getDoc, getDocs, limit, limitToLast, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch, type Firestore, type QueryDocumentSnapshot } from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { nativePhotoAdapter } from './photo-native';
import { PHOTO_UPLOAD_ERROR, processAndUploadPhoto } from './photo-processing';
import { ageFromBirthDate, canonicalPair, filterCards, validateProfile } from './model';
import type { Account, Card, Match, Membership, Message, Profile, ProfileInput } from './contracts';
function database(): Firestore { if (!db) throw new Error('MakeIn profiles are not connected yet. Use the labelled demo while setup is completed.'); return db; }
function owner(uid: string) { if (!auth?.currentUser || auth.currentUser.uid !== uid) throw new Error('Sign in to your own MakeIn account to continue.'); }
const interactionId = (from: string, to: string) => { canonicalPair(from, to); return `${from}~${to}`; };
const asCard = (snapshot: QueryDocumentSnapshot) => ({ ...snapshot.data(), id: snapshot.id } as Card);
export async function loadProfile(uid: string): Promise<Profile | null> { const value = await getDoc(doc(database(), 'profiles', uid)); return value.exists() ? value.data() as Profile : null; }
export async function loadAccount(uid: string): Promise<Account | null> { owner(uid); const value = await getDoc(doc(database(), 'accounts', uid)); return value.exists() ? value.data() as Account : null; }
export async function saveProfile(uid: string, input: ProfileInput): Promise<Profile> {
  owner(uid); const error = validateProfile(input); if (error) throw new Error(error);
  const { birthDate, ...publicInput } = input;
  const profile: Profile = { ...publicInput, name: input.name.trim(), location: input.location.trim(), bio: input.bio.trim(), age: ageFromBirthDate(birthDate), status: 'active' };
  const batch = writeBatch(database()); batch.set(doc(database(), 'accounts', uid), { birthDate }); batch.set(doc(database(), 'profiles', uid), profile); await batch.commit(); return profile;
}
// ponytail: relationship lists fit an initial small community; move fan-out/cleanup to paginated server jobs at scale.
async function blocksFor(uid: string): Promise<Set<string>> {
  const databaseInstance = database();
  const [outgoing, incoming] = await Promise.all([getDocs(query(collection(databaseInstance, 'blocks'), where('from', '==', uid))), getDocs(query(collection(databaseInstance, 'blocks'), where('to', '==', uid)))]);
  return new Set([...outgoing.docs.map(d => d.data().to as string), ...incoming.docs.map(d => d.data().from as string)]);
}
export async function discover(uid: string, profile: Profile): Promise<Card[]> {
  owner(uid);
  // ponytail: bounded first 100 active profiles; use server-side geospatial/cursor discovery when the pool grows.
  const [profiles, sent, blocked] = await Promise.all([getDocs(query(collection(database(), 'profiles'), where('status', '==', 'active'), limit(100))), getDocs(query(collection(database(), 'interactions'), where('from', '==', uid))), blocksFor(uid)]);
  const seen = new Set(sent.docs.map(d => d.data().to as string));
  return filterCards(profiles.docs.map(asCard).filter(c => c.id !== uid && !seen.has(c.id) && !blocked.has(c.id)), profile, { minAge: 18, maxAge: 100, location: '' });
}
export async function recordInterest(uid: string, target: Card, decision: 'like' | 'pass'): Promise<boolean> {
  owner(uid); if (target.demo || target.id.startsWith('demo-')) throw new Error('Demo interactions stay inside the demo.');
  if (!['like', 'pass'].includes(decision)) throw new Error('Choose Like or Pass.');
  const instance = database(); const pair = canonicalPair(uid, target.id);
  return runTransaction(instance, async tx => {
    const ownRef = doc(instance, 'interactions', interactionId(uid, target.id));
    const reverseRef = doc(instance, 'interactions', interactionId(target.id, uid));
    const matchRef = doc(instance, 'matches', pair.id);
    const [own, reverse, existing, mine, theirs] = await Promise.all([tx.get(ownRef), tx.get(reverseRef), tx.get(matchRef), tx.get(doc(instance, 'profiles', uid)), tx.get(doc(instance, 'profiles', target.id))]);
    if (own.exists()) return existing.exists() && existing.data().status === 'active';
    if (!mine.exists() || !theirs.exists()) throw new Error('This profile is no longer available.');
    const mutual = decision === 'like' && reverse.exists() && reverse.data().decision === 'like';
    tx.set(ownRef, { from: uid, to: target.id, decision, createdAt: serverTimestamp() });
    if (mutual && !existing.exists()) tx.set(matchRef, { members: pair.members, names: { [uid]: mine.data().name, [target.id]: theirs.data().name }, photos: { [uid]: mine.data().photos[0], [target.id]: theirs.data().photos[0] }, status: 'active', createdAt: serverTimestamp() });
    return mutual && (!existing.exists() || existing.data().status === 'active');
  });
}
export async function getIncomingInterests(uid: string): Promise<Card[]> {
  owner(uid); const [likes, sent, blocked] = await Promise.all([getDocs(query(collection(database(), 'interactions'), where('to', '==', uid), where('decision', '==', 'like'))), getDocs(query(collection(database(), 'interactions'), where('from', '==', uid))), blocksFor(uid)]);
  const handled = new Set(sent.docs.map(d => d.data().to as string));
  const profiles = await Promise.all(likes.docs.filter(d => !blocked.has(d.data().from) && !handled.has(d.data().from)).map(async like => { try { const profile = await loadProfile(like.data().from); return profile?.status === 'active' ? { ...profile, id: like.data().from } as Card : null; } catch (error) { if ((error as { code?: string }).code === 'permission-denied') return null; throw error; } }));
  return profiles.filter((p): p is Card => !!p);
}
export function watchMatches(uid: string, next: (matches: Match[]) => void, error: (error: Error) => void): () => void {
  try { owner(uid); return onSnapshot(query(collection(database(), 'matches'), where('members', 'array-contains', uid), where('status', '==', 'active')), snapshot => next(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Match))), error); } catch (e) { error(e as Error); return () => {}; }
}
export function watchMessages(matchId: string, next: (messages: Message[]) => void, error: (error: Error) => void): () => void {
  try { return onSnapshot(query(collection(database(), 'matches', matchId, 'messages'), orderBy('createdAt', 'asc'), limitToLast(200)), snapshot => next(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Message))), error); } catch (e) { error(e as Error); return () => {}; }
}
export async function sendMessage(matchId: string, uid: string, text: string): Promise<void> {
  owner(uid); const message = text.trim(); if (!message || message.length > 2000) throw new Error('Write a message of 1–2,000 characters.');
  await setDoc(doc(collection(database(), 'matches', matchId, 'messages')), { sender: uid, text: message, createdAt: serverTimestamp() });
}
export function watchMembership(uid: string, next: (m: Membership | null) => void, error: (e: Error) => void): () => void {
  try { owner(uid); return onSnapshot(doc(database(), 'entitlements', uid), value => next(value.exists() ? value.data() as Membership : null), error); } catch (e) { error(e as Error); return () => {}; }
}
export async function uploadPhoto(uid: string, uri: string): Promise<string> {
  owner(uid);
  const photoStorage = storage;
  if (!photoStorage) throw new Error(PHOTO_UPLOAD_ERROR);
  return processAndUploadPhoto(uri, nativePhotoAdapter, async bytes => {
    const destination = ref(photoStorage, `profiles/${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
    await uploadBytes(destination, bytes, { contentType: 'image/jpeg' });
    return await getDownloadURL(destination);
  });
}
export async function blockUser(uid: string, targetId: string): Promise<void> {
  owner(uid); const instance = database(); const pair = canonicalPair(uid, targetId);
  const blockRef = doc(instance, 'blocks', interactionId(uid, targetId));
  await runTransaction(instance, async tx => { const existing = await tx.get(blockRef); if (!existing.exists()) tx.set(blockRef, { from: uid, to: targetId, createdAt: serverTimestamp() }); });
  const match = await getDoc(doc(instance, 'matches', pair.id)); if (match.exists() && match.data().status === 'active') await updateDoc(match.ref, { status: 'ended' });
}
export async function reportUser(uid: string, targetId: string, reason: string): Promise<void> {
  owner(uid); canonicalPair(uid, targetId); if (!reason.trim() || reason.length > 500) throw new Error('Describe your report in 1–500 characters.');
  await setDoc(doc(collection(database(), 'reports')), { reporter: uid, target: targetId, reason: reason.trim(), createdAt: serverTimestamp() });
}
export async function endMatch(matchId: string, uid: string): Promise<void> { owner(uid); await updateDoc(doc(database(), 'matches', matchId), { status: 'ended' }); }
async function removeQueryDocuments(docs: QueryDocumentSnapshot[]): Promise<void> {
  for (let start = 0; start < docs.length; start += 400) { const batch = writeBatch(database()); docs.slice(start, start + 400).forEach(item => batch.delete(item.ref)); await batch.commit(); }
}
export async function deleteAccountData(uid: string): Promise<void> {
  owner(uid); const instance = database(); const profileRef = doc(instance, 'profiles', uid); const profile = await getDoc(profileRef);
  // Freeze interactions first. Cleanup can safely be retried if the network drops.
  if (profile.exists() && profile.data().status !== 'deleting') await updateDoc(profileRef, { status: 'deleting' });
  const matches = await getDocs(query(collection(instance, 'matches'), where('members', 'array-contains', uid)));
  for (const match of matches.docs) {
    while (true) { const messages = await getDocs(query(collection(match.ref, 'messages'), limit(400))); if (messages.empty) break; await removeQueryDocuments(messages.docs); }
    await deleteDoc(match.ref);
  }
  for (const [name, field] of [['interactions', 'from'], ['interactions', 'to'], ['blocks', 'from'], ['blocks', 'to'], ['reports', 'reporter']] as const) {
    await removeQueryDocuments((await getDocs(query(collection(instance, name), where(field, '==', uid)))).docs);
  }
  if (storage) { const files = await listAll(ref(storage, `profiles/${uid}`)); await Promise.all(files.items.map(item => deleteObject(item))); }
  const batch = writeBatch(instance); batch.delete(profileRef); batch.delete(doc(instance, 'accounts', uid)); await batch.commit();
}
