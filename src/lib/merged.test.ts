import assert from 'node:assert/strict';
import test from 'node:test';
import { recommendFriends, validateProfile } from './model.ts';
import { demoCards, demoProfile, demoProfileInput } from './demo.ts';
import { LEARN_CARDS, LEARN_STARTER_PROMPTS } from './learn-cards.ts';
import { askLearnCoach, demoLearnReply } from './learn-ai.ts';

test('validateProfile accepts optional languages and mood and rejects duplicates or overflow', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  assert.equal(validateProfile(demoProfileInput, now), null);
  assert.equal(validateProfile({ ...demoProfileInput, languages: ['English', 'Telugu'], mood: 'Coffee & walks' }, now), null);
  assert.ok(validateProfile({ ...demoProfileInput, languages: ['English', 'English'] }, now));
  assert.ok(validateProfile({ ...demoProfileInput, languages: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }, now));
  assert.ok(validateProfile({ ...demoProfileInput, mood: 'x'.repeat(41) }, now));
});

test('recommendFriends prioritizes shared languages, interests, city and filters by query/language', () => {
  const all = recommendFriends(demoProfile, demoCards);
  assert.equal(all.length, demoCards.length);
  const tamil = recommendFriends(demoProfile, demoCards, { language: 'Tamil' });
  assert.ok(tamil.length > 0 && tamil.every(p => p.languages?.includes('Tamil')));
  const searched = recommendFriends(demoProfile, demoCards, { query: 'hyderabad' });
  assert.deepEqual(searched.map(p => p.name), ['Noor']);
});

test('Learn guide cards and AI coach fallback provide bounded, helpful outputs', async () => {
  assert.ok(LEARN_CARDS.length >= 6);
  for (const card of LEARN_CARDS) {
    assert.ok(card.image.startsWith('https://'));
    assert.ok(card.tips.length >= 3);
    assert.ok(card.practicePrompt.length > 10);
  }
  assert.ok(LEARN_STARTER_PROMPTS.length >= 4);
  assert.match(demoLearnReply('Write a first opener for coffee'), /coffee/i);
  const res = await askLearnCoach({ prompt: 'Practice flirting with me', history: [], user: null, demo: true });
  assert.equal(res.offline, true);
  assert.ok(res.reply.length > 20);
  await assert.rejects(() => askLearnCoach({ prompt: '   ', history: [], user: null, demo: true }));
});
