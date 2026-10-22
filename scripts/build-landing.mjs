import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'landing');
const output = resolve(root, 'landing-dist');
const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const releaseURL = (name, fallback) => {
  const configured = process.env[name]?.trim();
  if (!configured && fallback.startsWith('#')) return fallback;
  let url;
  try { url = new URL(configured || fallback); }
  catch { throw new Error(`${name} must be a public HTTPS URL`); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${name} must be a public HTTPS URL`);
  return escape(url.href);
};
const iosAvailable = Boolean(process.env.MAKEIN_IOS_URL?.trim());
const tokens = {
  ANDROID_URL: releaseURL('MAKEIN_ANDROID_URL', 'https://expo.dev/accounts/nithindidigam/projects/makein/builds/04f712cc-1fe3-4974-a50a-b1e9d8ea997d'),
  IOS_URL: releaseURL('MAKEIN_IOS_URL', '#availability'),
  IOS_LABEL: iosAvailable ? 'iOS preview access' : 'iOS preview in preparation',
  IOS_STATUS: iosAvailable ? 'An iOS preview access link is available below. This does not imply App Store publication.' : 'iOS testing is being prepared. A TestFlight or App Store download is not available yet.',
};

// Read and validate sources before changing the one fixed build directory.
const files = ['index.html', 'privacy.html', 'terms.html', '404.html', 'styles.css'];
const contents = await Promise.all(files.map(async (name) => [name, await readFile(resolve(source, name), 'utf8')]));
const assets = await readdir(resolve(source, 'assets'));
if (!assets.length) throw new Error('Landing assets are missing');
for (const [, content] of contents) {
  for (const [, token] of content.matchAll(/__([A-Z_]+)__/g)) if (!(token in tokens)) throw new Error(`Unknown landing token: ${token}`);
}
if (output !== resolve(root, 'landing-dist')) throw new Error('Unexpected landing output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [name, content] of contents) await writeFile(resolve(output, name), content.replace(/__([A-Z_]+)__/g, (_, key) => tokens[key]));
await cp(resolve(source, 'assets'), resolve(output, 'assets'), { recursive: true });
console.log(`Built standalone MakeIn landing page: ${output}`);
