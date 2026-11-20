const assert = require('node:assert/strict');
const test = require('node:test');
const { mkdtemp, mkdir, readFile, writeFile, rm } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const withWebRtcR8 = require('./withWebRtcR8.cjs');

test('Android prebuild adds only the orphan Dav1d interface exception, once, preserving existing rules', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'makezy-r8-plugin-'));
  try {
    const androidRoot = path.join(projectRoot, 'android');
    await mkdir(path.join(androidRoot, 'app'), { recursive: true });
    const rulesPath = path.join(androidRoot, 'app', 'proguard-rules.pro');
    const original = '# Generated application rules\n-keep class example.Required { *; }\n';
    await writeFile(rulesPath, original);
    const config = withWebRtcR8({ name: 'Makezy', slug: 'makezy' });
    assert.equal(config.mods.ios, undefined);
    for (let i = 0; i < 2; i++) await config.mods.android.dangerous({ ...config, modRequest: { projectRoot, platformProjectRoot: androidRoot }, modResults: {} });
    const result = await readFile(rulesPath, 'utf8');
    assert.ok(result.startsWith(original));
    assert.deepEqual(result.split('\n').filter(line => line.startsWith('-dontwarn')), ['-dontwarn org.webrtc.Dav1dDecoder$Natives']);
    assert.ok(!result.includes('-dontshrink'));
    assert.ok(!result.includes('-dontoptimize'));
  } finally { await rm(projectRoot, { recursive: true, force: true }); }
});
