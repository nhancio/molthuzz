import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import assert from 'node:assert/strict';
import { test, before, after, beforeEach } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { uploadBytes, ref as storageRef, listAll, getMetadata, deleteObject } from 'firebase/storage';
const projectId = 'demo-makein';
let env;
let services;
// Replace only platform initialization; production data/model code and Firestore SDK run unchanged.
registerHooks({resolve(specifier,context,nextResolve) {
  if (context.parentURL?.endsWith('/src/lib/data.ts') && specifier === './firebase') return {url:'data:text/javascript,export const db=globalThis.__makeinServiceTest.db;export const auth=globalThis.__makeinServiceTest.auth;export const storage=null;',shortCircuit:true};
  if (context.parentURL?.includes('/src/lib/') && specifier.startsWith('./') && !specifier.endsWith('.ts')) return nextResolve(new URL(specifier+'.ts',context.parentURL).href,context);
  return nextResolve(specifier,context);
}});
const makeProfile = (name) => ({ name, age: new Date().getUTCFullYear() - 1998, gender: 'Woman', interestedIn: ['Woman','Man','Non-binary'], location: 'Bengaluru', bio: 'An adult profile', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb'], interests: ['Art'], intent: 'A relationship', prompts: [], status: 'active' });
const db = uid => env.authenticatedContext(uid).firestore();
const interact = (database, from, to, decision='like') => setDoc(doc(database,'interactions',`${from}~${to}`), {from,to,decision,createdAt:serverTimestamp()});
const matchData = () => ({members:['alice','bob'],names:{alice:'Alice',bob:'Bob'},photos:{alice:makeProfile('Alice').photos[0],bob:makeProfile('Bob').photos[0]},status:'active',createdAt:serverTimestamp()});
async function seed(uid, options={}) {
  await env.withSecurityRulesDisabled(async ctx => { const store=ctx.firestore(); await setDoc(doc(store,'accounts',uid),{birthDate:'1998-01-01'}); await setDoc(doc(store,'profiles',uid),makeProfile(uid[0].toUpperCase()+uid.slice(1))); await setDoc(doc(store,'entitlements',uid),{status:options.status??'active',currentPeriodEnd:options.end??Date.now()+86400000}); });
}
async function mutual() { await interact(db('alice'),'alice','bob'); await interact(db('bob'),'bob','alice'); await setDoc(doc(db('alice'),'matches','alice~bob'),matchData()); }
before(async () => { const [host,port] = (process.env.FIRESTORE_EMULATOR_HOST??'127.0.0.1:8080').split(':'); env=await initializeTestEnvironment({projectId,firestore:{host,port:Number(port),rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}, ...(process.env.FIREBASE_STORAGE_EMULATOR_HOST ? {storage:{host:process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':')[0],port:Number(process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':')[1]),rules:readFileSync(new URL('../storage.rules',import.meta.url),'utf8')}} : {})}); globalThis.__makeinServiceTest={db:db('alice'),auth:{currentUser:{uid:'alice'}}}; services=await import('../src/lib/data.ts'); });
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await seed('alice'); await seed('bob'); await seed('eve'); });
test('owner reads private account and entitlement; no client grants paid access',async()=>{
  await assertSucceeds(getDoc(doc(db('alice'),'accounts','alice')));
  await assertFails(getDoc(doc(db('eve'),'accounts','alice')));
  await assertFails(getDoc(doc(db('eve'),'entitlements','alice')));
  await assertFails(setDoc(doc(db('alice'),'entitlements','alice'),{status:'active',currentPeriodEnd:Date.now()+1e12}));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'profiles','alice')));
});
test('outsiders cannot probe existence of other relationship IDs',async()=>{
  for(const name of ['interactions','matches','blocks']) await assertFails(getDoc(doc(db('eve'),name,'alice~missing')));
});
test('strict profiles reject private leakage, minors, impossible DOB, schemas and transient photos',async()=>{
  const store=db('alice');
  await assertFails(updateDoc(doc(store,'profiles','alice'),{birthDate:'1998-01-01'}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{name:'   '}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{bio:'\n \t'}));
  await assertFails(setDoc(doc(store,'accounts','alice'),{birthDate:'1997-01-01'}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{age:17}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{photos:['data:image/png,x']}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{prompts:[{question:'a',answer:'b',secret:'x'}]}));
  await assertFails(setDoc(doc(store,'accounts','alice'),{birthDate:'1998-02-30'}));
  await assertFails(setDoc(doc(store,'accounts','alice'),{birthDate:'2015-01-01'}));
  await assertFails(updateDoc(doc(db('eve'),'profiles','alice'),{name:'Forged'}));
  const batch=writeBatch(store); batch.set(doc(store,'accounts','alice'),{birthDate:'1998-01-01'}); batch.set(doc(store,'profiles','alice'),makeProfile('Alice')); await assertSucceeds(batch.commit());
});
test('production onboarding saves a maximum profile and private DOB atomically',async()=>{
  await env.withSecurityRulesDisabled(async ctx=>{await deleteDoc(doc(ctx.firestore(),'accounts','alice'));await deleteDoc(doc(ctx.firestore(),'profiles','alice'));});
  const {age,status,...fields}=makeProfile('Alice');
  const input={...fields,birthDate:'1998-01-01',bio:'Hello\nworld',photos:Array(6).fill(fields.photos[0]),interests:['Art','Travel','Music','Coffee','Food','Books','Dance','Nature'],prompts:Array(3).fill({question:'A question',answer:'A multiline\nanswer'})};
  const profile=await services.saveProfile('alice',input);
  assert.equal(profile.age,new Date().getUTCFullYear()-1998);
  assert.equal('birthDate' in await services.loadProfile('alice'),false);
  assert.deepEqual(await services.loadAccount('alice'),{birthDate:'1998-01-01'});
});
test('queries support active discovery, own incoming likes, blocks and matches without broad leakage',async()=>{
  await interact(db('alice'),'alice','bob');
  await assertSucceeds(getDocs(query(collection(db('alice'),'profiles'),where('status','==','active'),limit(100))));
  await assertSucceeds(getDocs(query(collection(db('bob'),'interactions'),where('to','==','bob'),where('decision','==','like'))));
  await assertSucceeds(getDocs(query(collection(db('alice'),'interactions'),where('from','==','alice'))));
  await assertFails(getDocs(collection(db('eve'),'interactions')));
  await assertSucceeds(getDocs(query(collection(db('alice'),'blocks'),where('from','==','alice'))));
  await assertSucceeds(getDocs(query(collection(db('alice'),'blocks'),where('to','==','alice'))));
  await assertSucceeds(getDocs(query(collection(db('alice'),'matches'),where('members','array-contains','alice'),where('status','==','active'))));
});
test('unpaid, expired, inactive profiles and forged recipient likes cannot interact',async()=>{
  await seed('alice',{status:'inactive'}); await assertFails(interact(db('alice'),'alice','bob'));
  await seed('alice',{end:Date.now()-1000}); await assertFails(interact(db('alice'),'alice','bob','pass'));
  await seed('alice'); await assertFails(interact(db('eve'),'alice','bob'));
  await updateDoc(doc(db('bob'),'profiles','bob'),{status:'paused'}); await assertFails(interact(db('alice'),'alice','bob'));
});
test('cancelled membership grants only remaining paid period',async()=>{
  await seed('alice',{status:'cancelled'}); await assertSucceeds(interact(db('alice'),'alice','bob'));
  await seed('alice',{status:'cancelled',end:Date.now()-1000}); await assertFails(interact(db('alice'),'alice','eve'));
});
test('likes are immutable; only reciprocal canonical matches can be created',async()=>{
  await assertFails(setDoc(doc(db('alice'),'matches','alice~bob'),matchData()));
  await interact(db('alice'),'alice','bob');
  await assertFails(interact(db('alice'),'alice','bob','pass'));
  await assertFails(setDoc(doc(db('alice'),'matches','alice~bob'),matchData()));
  await interact(db('bob'),'bob','alice');
  await assertFails(setDoc(doc(db('alice'),'matches','bob~alice'),{...matchData(),members:['bob','alice']}));
  await assertSucceeds(setDoc(doc(db('alice'),'matches','alice~bob'),matchData()));
  await assertFails(updateDoc(doc(db('alice'),'matches','alice~bob'),{members:['alice','eve']}));
});
test('production recordInterest atomically creates reciprocal match and is idempotent',async()=>{
  await interact(db('bob'),'bob','alice');
  const target={...makeProfile('Bob'),id:'bob'};
  assert.equal(await services.recordInterest('alice',target,'like'),true);
  assert.equal(await services.recordInterest('alice',target,'like'),true);
  const match=await getDoc(doc(db('alice'),'matches','alice~bob'));
  assert.deepEqual(match.data().members,['alice','bob']);
});
test('production incoming likes exclude outgoing passes and likes after refresh',async()=>{
  await interact(db('bob'),'bob','alice'); await interact(db('eve'),'eve','alice');
  await services.recordInterest('alice',{...makeProfile('Bob'),id:'bob'},'pass');
  assert.deepEqual((await services.getIncomingInterests('alice')).map(p=>p.id),['eve']);
  await services.recordInterest('alice',{...makeProfile('Eve'),id:'eve'},'like');
  assert.deepEqual(await services.getIncomingInterests('alice'),[]);
});
test('chat requires paid matched sender, denies outsiders, spoofing and oversized messages',async()=>{
  const message=doc(db('alice'),'matches','alice~bob','messages','one');
  const payload={sender:'alice',text:'Hello',createdAt:serverTimestamp()};
  await assertFails(setDoc(message,payload)); await mutual(); await assertSucceeds(setDoc(message,payload));
  await assertFails(getDoc(doc(db('eve'),'matches','alice~bob')));
  await assertFails(getDocs(collection(db('eve'),'matches','alice~bob','messages')));
  await assertFails(setDoc(doc(db('bob'),'matches','alice~bob','messages','two'),payload));
  await assertFails(setDoc(doc(db('alice'),'matches','alice~bob','messages','three'),{...payload,text:'x'.repeat(2001)}));
  await seed('alice',{status:'inactive'}); await assertFails(setDoc(doc(db('alice'),'matches','alice~bob','messages','four'),payload));
});
test('either block direction denies new likes and chat; ending cannot be undone',async()=>{
  await mutual(); await setDoc(doc(db('bob'),'blocks','bob~alice'),{from:'bob',to:'alice',createdAt:serverTimestamp()});
  await assertFails(setDoc(doc(db('alice'),'matches','alice~bob','messages','one'),{sender:'alice',text:'Hello',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(db('bob'),'matches','alice~bob','messages','two'),{sender:'bob',text:'Hello',createdAt:serverTimestamp()}));
  await updateDoc(doc(db('alice'),'matches','alice~bob'),{status:'ended'}); await assertFails(updateDoc(doc(db('bob'),'matches','alice~bob'),{status:'active'}));
  await setDoc(doc(db('alice'),'blocks','alice~eve'),{from:'alice',to:'eve',createdAt:serverTimestamp()}); await assertFails(interact(db('eve'),'eve','alice')); await assertFails(interact(db('alice'),'alice','eve'));
});
test('reports and blocks cannot impersonate another account or expose reports',async()=>{
  const report={reporter:'alice',target:'bob',reason:'Unwanted messages',createdAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(db('alice'),'reports','one'),report));
  await assertFails(setDoc(doc(db('eve'),'reports','two'),report));
  await assertFails(getDoc(doc(db('bob'),'reports','one')));
  await assertFails(setDoc(doc(db('alice'),'reports','three'),{...report,reason:'   '}));
  await assertFails(setDoc(doc(db('eve'),'blocks','alice~bob'),{from:'alice',to:'bob',createdAt:serverTimestamp()}));
  await assertSucceeds(getDocs(query(collection(db('alice'),'reports'),where('reporter','==','alice'))));
});
test('deletion freezes profile and permits complete own relationship/message cleanup',async()=>{
  await mutual(); const store=db('alice'); const message=doc(store,'matches','alice~bob','messages','one');
  await setDoc(message,{sender:'alice',text:'Hello',createdAt:serverTimestamp()});
  await assertFails(deleteDoc(message)); await updateDoc(doc(store,'profiles','alice'),{status:'deleting'});
  await assertFails(setDoc(doc(db('bob'),'matches','alice~bob','messages','two'),{sender:'bob',text:'Hello',createdAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(store,'profiles','alice'),{status:'active'}));
  await assertSucceeds(deleteDoc(message)); await assertSucceeds(deleteDoc(doc(store,'matches','alice~bob'))); await assertSucceeds(deleteDoc(doc(store,'interactions','bob~alice'))); await assertSucceeds(deleteDoc(doc(store,'interactions','alice~bob')));
  const batch=writeBatch(store); batch.delete(doc(store,'profiles','alice')); batch.delete(doc(store,'accounts','alice')); await assertSucceeds(batch.commit());
});

test('production block, report and cleanup remove relationships and private profile',async()=>{
  await mutual(); await services.sendMessage('alice~bob','alice','Hello');
  await services.blockUser('alice','bob'); await services.blockUser('alice','bob');
  await services.reportUser('alice','bob','Unwanted messages');
  await assert.rejects(services.sendMessage('alice~bob','alice','Blocked'));
  await services.deleteAccountData('alice');
  assert.equal(await services.loadProfile('alice'),null); assert.equal(await services.loadAccount('alice'),null);
  assert.equal((await getDoc(doc(db('alice'),'matches','alice~bob'))).exists(),false);
  for (const [name,field] of [['interactions','from'],['interactions','to'],['blocks','from'],['blocks','to'],['reports','reporter']]) assert.equal((await getDocs(query(collection(db('alice'),name),where(field,'==','alice')))).size,0);
});
test('production account cleanup resumes after an interruption leaves a frozen profile',async()=>{
  await mutual(); await services.sendMessage('alice~bob','alice','A message awaiting cleanup');
  await updateDoc(doc(db('alice'),'profiles','alice'),{status:'deleting'});
  await deleteDoc(doc(db('alice'),'interactions','alice~bob'));
  await services.deleteAccountData('alice');
  assert.equal(await services.loadProfile('alice'),null);
  assert.equal(await services.loadAccount('alice'),null);
  assert.equal((await getDoc(doc(db('alice'),'matches','alice~bob'))).exists(),false);
  assert.equal((await getDocs(query(collection(db('alice'),'interactions'),where('to','==','alice')))).size,0);
  await services.deleteAccountData('alice');
});
test('storage validates ownership, image MIME, size, list and cleanup',{skip:!process.env.FIREBASE_STORAGE_EMULATOR_HOST},async()=>{
  await env.clearStorage();
  const alice=env.authenticatedContext('alice').storage(); const bob=env.authenticatedContext('bob').storage();
  const image=storageRef(alice,'profiles/alice/photo.jpg');
  await assertSucceeds(uploadBytes(image,new Uint8Array([1,2,3]),{contentType:'image/jpeg'}));
  await assertSucceeds(listAll(storageRef(alice,'profiles/alice')));
  await assertSucceeds(getMetadata(storageRef(bob,'profiles/alice/photo.jpg')));
  await assertFails(listAll(storageRef(bob,'profiles/alice')));
  await assertFails(uploadBytes(storageRef(bob,'profiles/alice/forged.jpg'),new Uint8Array([1]),{contentType:'image/jpeg'}));
  await assertFails(uploadBytes(storageRef(alice,'profiles/alice/page.html'),new Uint8Array([1]),{contentType:'text/html'}));
  await assertFails(uploadBytes(storageRef(alice,'profiles/alice/large.jpg'),new Uint8Array(8*1024*1024+1),{contentType:'image/jpeg'}));
  await assertFails(deleteObject(storageRef(bob,'profiles/alice/photo.jpg')));
  await assertSucceeds(deleteObject(image));
});
