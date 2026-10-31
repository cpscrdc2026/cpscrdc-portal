import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const url = html.match(/const SUPABASE_URL="(https:\/\/[^"]+)"/);
const key = html.match(/const SUPABASE_KEY="(sb_publishable_[^"]+)"/);
assert.ok(url && key, 'Could not read public Supabase configuration from index.html');

const response = await fetch(`${url[1]}/auth/v1/health`, {
  headers: { apikey: key[1] },
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.status, 200, `Supabase Auth health returned HTTP ${response.status}`);
const health = await response.json();
assert.ok(health.name && health.version, 'Supabase Auth health response is incomplete');
console.log(`Supabase Auth is healthy (${health.version}).`);

