import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../assets/js/portal.js", import.meta.url), "utf8");
const url = app.match(/const SUPABASE_URL\s*=\s*["'](https:\/\/[^"']+)["']/);
const key = app.match(/const SUPABASE_KEY\s*=\s*["'](sb_publishable_[^"']+)["']/);
assert.ok(url && key, "Could not read public Supabase configuration from assets/js/portal.js");

const response = await fetch(`${url[1]}/auth/v1/health`, {
  headers: { apikey: key[1] },
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.status, 200, `Supabase Auth health returned HTTP ${response.status}`);
const health = await response.json();
assert.ok(health.name && health.version, "Supabase Auth health response is incomplete");
console.log(`Supabase Auth is healthy (${health.version}).`);
