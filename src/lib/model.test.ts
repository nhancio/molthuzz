import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageFromBirthDate, validateProfile, swipeDirection, canonicalPair, filterCards, membershipActive, addCalendarMonth } from './model.ts';
import type { ProfileInput, Profile, Card } from './contracts.ts';
const now = new Date('2026-10-23T12:00:00Z');
const input: ProfileInput = { name: 'Alex', birthDate: '2000-10-23', gender: 'Non-binary', interestedIn: ['Woman', 'Man', 'Non-binary'], location: 'Bengaluru', bio: 'Coffee and long walks.', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb'], interests: ['Art'], intent: 'A relationship', prompts: [] };
test('validates adult birthday boundary and rejects impossible or out of range dates', () => {
  assert.equal(ageFromBirthDate('2008-10-23', now), 18);
  assert.equal(ageFromBirthDate('2008-10-24', now), 17);
  assert.ok(Number.isNaN(ageFromBirthDate('2000-02-30', now)));
  assert.ok(Number.isNaN(ageFromBirthDate('2026-1-1', now)));
  assert.equal(validateProfile(input, now), null);
  assert.match(validateProfile({ ...input, birthDate: '2008-10-24' }, now)!, /18/);
  assert.ok(validateProfile({ ...input, birthDate: '1900-01-01' }, now));
});
test('rejects transient photos, unknown fields, empty preferences and invalid schemas', () => {
  for (const photos of [['data:image/png;base64,x'], ['http://example.com/photo.jpg'], ['blob:temporary'], ['https://'], []]) assert.ok(validateProfile({ ...input, photos }, now));
  assert.ok(validateProfile({ ...input, interestedIn: [] }, now));
  assert.ok(validateProfile({ ...input, bio: 'x'.repeat(501) }, now));
  assert.ok(validateProfile({ ...input, interests: ['Art', 'Art'] }, now));
  assert.ok(validateProfile({ ...input, extra: 'private' } as ProfileInput, now));
});
test('swipe requires deliberate distance or velocity in the same direction', () => {
  assert.equal(swipeDirection(119, 0), null);
  assert.equal(swipeDirection(120, 0), 'like');
  assert.equal(swipeDirection(-120, 0), 'pass');
  assert.equal(swipeDirection(30, 0.7), 'like');
  assert.equal(swipeDirection(-30, -0.7), 'pass');
  assert.equal(swipeDirection(30, -0.7), null);
});
test('canonical pairs are order independent and reject self matching', () => {
  assert.deepEqual(canonicalPair('bob', 'alice'), { id: 'alice~bob', members: ['alice', 'bob'] });
  assert.deepEqual(canonicalPair('alice', 'bob'), canonicalPair('bob', 'alice'));
  assert.throws(() => canonicalPair('alice', 'alice'));
});
test('discovery respects both preferences, age, city and active status', () => {
  const profile: Profile = { ...input, age: 26, status: 'active' }; delete (profile as any).birthDate;
  const card: Card = { ...profile, id: 'one', gender: 'Woman', interestedIn: ['Non-binary'] };
  const cards = [card, { ...card, id: 'young', age: 19 }, { ...card, id: 'paused', status: 'paused' as const }, { ...card, id: 'preference', interestedIn: ['Man' as const] }, { ...card, id: 'city', location: 'Mumbai' }];
  assert.deepEqual(filterCards(cards, profile, { minAge: 21, maxAge: 35, location: 'bengaluru' }).map(c => c.id), ['one']);
});
test('paid cancellation preserves access only until the exact paid end', () => {
  assert.equal(membershipActive({ status: 'active', currentPeriodEnd: 101 }, 100), true);
  assert.equal(membershipActive({ status: 'cancelled', currentPeriodEnd: 101 }, 100), true);
  assert.equal(membershipActive({ status: 'active', currentPeriodEnd: 100 }, 100), false);
  assert.equal(membershipActive({ status: 'inactive', currentPeriodEnd: 101 }, 100), false);
  assert.equal(membershipActive(null, 100), false);
});
test('calendar month arithmetic clamps short months without overflow', () => {
  assert.equal(addCalendarMonth(new Date('2024-01-31T10:00:00Z')).toISOString(), '2024-02-29T10:00:00.000Z');
  assert.equal(addCalendarMonth(new Date('2026-12-23T10:00:00Z')).toISOString(), '2027-01-23T10:00:00.000Z');
});
