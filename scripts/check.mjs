import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /<!doctype html>/i, 'index.html must declare HTML5');
assert.match(html, /<\/html>\s*$/i, 'index.html must close the root element');
assert.doesNotMatch(html, /<\/small>>/, 'small helper text must not leave stray markup characters');

const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(inlineScripts.length, 1, 'expected one inline application script');
for (const [, source] of inlineScripts) {
  new vm.Script(source, { filename: 'index.html:inline-script' });
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(([, id]) => id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicates)], [], 'HTML element IDs must be unique');

assert.match(html, /const SUPABASE_URL="https:\/\/[a-z0-9]+\.supabase\.co"/i,
  'Supabase URL must point to HTTPS');
assert.match(html, /const SUPABASE_KEY="sb_publishable_[^"]+"/,
  'browser client must use a publishable key, never a server secret');
assert.doesNotMatch(html, /sb_secret_[A-Za-z0-9_-]+|service_role["'\s:=]+[A-Za-z0-9_-]{20,}/i,
  'server-side Supabase credentials must not appear in the public page');

console.log(`Portal checks passed: ${inlineScripts.length} inline script, ${ids.length} unique IDs, HTTPS Supabase config, no server secret.`);

