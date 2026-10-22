import assert from 'node:assert/strict';
import test from 'node:test';
import { languageFromDevice, loadLanguage, persistLanguage, preferenceKey } from './language.ts';

test('device locale negotiation follows preferred supported languages and falls back to English', () => {
  assert.equal(languageFromDevice(['fr-FR', 'te-IN', 'en-US']), 'te');
  assert.equal(languageFromDevice(['BN_in']), 'bn');
  assert.equal(languageFromDevice(['gu-Gujr-IN']), 'gu');
  assert.equal(languageFromDevice(['fr-FR']), 'en');
  assert.equal(languageFromDevice([]), 'en');
});

test('persisted explicit language wins across restart, device-default follows phone language', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => { values.set(key, value); },
  };
  assert.deepEqual(await loadLanguage(storage, ['ta-IN']), { preference: 'device', language: 'ta' });
  assert.deepEqual(await persistLanguage(storage, 'hi', ['ta-IN']), { preference: 'hi', language: 'hi' });
  assert.deepEqual(await loadLanguage(storage, ['kn-IN']), { preference: 'hi', language: 'hi' });
  await persistLanguage(storage, 'device', ['kn-IN']);
  assert.deepEqual(await loadLanguage(storage, ['mr-IN']), { preference: 'device', language: 'mr' });
  values.set(preferenceKey, 'unsupported-or-corrupt');
  assert.deepEqual(await loadLanguage(storage, ['ml-IN']), { preference: 'device', language: 'ml' });
});

test('invalid choice and failed writes cannot pretend that a preference was saved', async () => {
  const storage = { getItem: async () => null, setItem: async () => { throw new Error('disk full'); } };
  await assert.rejects(persistLanguage(storage, 'de' as never, ['hi-IN']), /Unsupported/);
  await assert.rejects(persistLanguage(storage, 'gu', ['hi-IN']), /disk full/);
});
