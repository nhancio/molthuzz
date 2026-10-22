import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createInstance } from 'i18next';
import { languages } from './language.ts';

const catalog = async (code: string): Promise<Record<string, string>> => JSON.parse(await readFile(new URL(`./locales/${code}.json`, import.meta.url), 'utf8'));
const tokens = (value: string) => [...value.matchAll(/{{\s*([^{}]+)\s*}}/g)].map((match) => match[1]).sort();

test('every bundled language covers the full catalog and preserves interpolation and confirmation tokens', async () => {
  const english = await catalog('en');
  const keys = Object.keys(english).sort();
  assert.ok(keys.length > 300, 'cover the complete app, not only navigation');
  for (const { code } of languages) {
    const translated = await catalog(code);
    assert.deepEqual(Object.keys(translated).sort(), keys, `${code} coverage`);
    let changed = 0;
    for (const key of keys) {
      assert.equal(typeof translated[key], 'string', `${code}: ${key}`);
      assert.ok(translated[key].trim(), `${code}: empty ${key}`);
      assert.deepEqual(tokens(translated[key]), tokens(english[key]), `${code}: placeholders in ${key}`);
      assert.deepEqual((translated[key].match(/\d+/g) || []).sort(), (english[key].match(/\d+/g) || []).sort(), `${code}: preserve amounts, limits and dates in ${key}`);
      assert.equal((translated[key].match(/₹/g) || []).length, (english[key].match(/₹/g) || []).length, `${code}: preserve INR amounts in ${key}`);
      if (key.includes('DELETE')) assert.ok(translated[key].includes('DELETE'), `${code}: preserve exact deletion token`);
      if (translated[key] !== english[key]) changed++;
    }
    if (code !== 'en') assert.ok(changed > keys.length * 0.95, `${code}: regional translations must not be English placeholders`);
  }
});

test('i18next switches immediately, preserves member interpolation and falls back to English', async () => {
  const entries = await Promise.all(languages.map(async ({ code }) => [code, { translation: await catalog(code) }] as const));
  const resources = Object.fromEntries(entries);
  const instance = createInstance();
  await instance.init({ resources, lng: 'en', fallbackLng: 'en', keySeparator: false, nsSeparator: false, interpolation: { escapeValue: false } });
  const seen: string[] = [];
  instance.on('languageChanged', (language) => seen.push(language));
  for (const { code } of languages.filter(({ code }) => code !== 'en')) {
    await instance.changeLanguage(code);
    assert.notEqual(instance.t('Continue'), 'Continue', code);
    const name = 'Asha & <3';
    assert.ok(instance.t('View {{name}}’s full profile', { name }).includes(name), `${code}: preserve member name`);
  }
  assert.equal(seen.length, languages.length - 1);
  instance.removeResourceBundle('gu', 'translation');
  assert.equal(instance.t('Continue'), 'Continue');
  assert.equal(instance.t('Unknown member-authored sentence'), 'Unknown member-authored sentence');
});
