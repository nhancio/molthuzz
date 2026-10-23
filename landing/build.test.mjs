import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const build = (env = {}) => spawnSync(process.execPath, ['scripts/build-landing.mjs'], {
  cwd: root, env: { ...process.env, MAKEIN_ANDROID_URL: '', MAKEIN_IOS_URL: '', ...env }, encoding: 'utf8',
});

test('landing build publishes a standalone site with resolvable local links', async () => {
  const result = build();
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(resolve(root, 'landing-dist/index.html'), 'utf8');
  assert.match(html, /Android preview build/);
  assert.match(html, /iOS preview in preparation/);
  assert.doesNotMatch(html, /__[A-Z_]+__|expo-router|entry\.bundle|<form/);
  for (const page of ['index.html', 'privacy.html', 'terms.html', '404.html']) {
    const content = await readFile(resolve(root, 'landing-dist', page), 'utf8');
    const ids = [...content.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, `duplicate HTML id in ${page}`);
    for (const [, link] of content.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https:|data:)/.test(link)) continue;
      const [path, anchor] = link.split('#');
      const target = path ? await readFile(resolve(root, 'landing-dist', path === '/' ? 'index.html' : path.replace(/^\//, '')), 'utf8') : content;
      if (anchor) assert.ok(target.includes(`id="${anchor}"`), `missing anchor ${link} in ${page}`);
    }
  }
  await readFile(resolve(root, 'landing-dist/404.html'));
});

test('release artifact URLs replace availability copy, and unsafe URLs fail', async () => {
  const result = build({ MAKEIN_ANDROID_URL: 'https://example.com/preview.apk?name=a&source=b', MAKEIN_IOS_URL: 'https://testflight.apple.com/join/example' });
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(resolve(root, 'landing-dist/index.html'), 'utf8');
  assert.match(html, /preview\.apk\?name=a&amp;source=b/);
  assert.match(html, /iOS preview access/);
  assert.match(html, /testflight\.apple\.com\/join\/example/);
  for (const value of ['javascript:alert(1)', '#invalid', 'http://example.com', 'https://user:password@example.com']) {
    const invalid = build({ MAKEIN_ANDROID_URL: value });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /HTTPS URL/);
  }
  const restore = build();
  assert.equal(restore.status, 0, restore.stderr);
});
