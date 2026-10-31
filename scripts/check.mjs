import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const [html, css, app, logo] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("assets/css/portal.css", root), "utf8"),
  readFile(new URL("assets/js/portal.js", root), "utf8"),
  readFile(new URL("assets/images/club-logo.jpg", root)),
]);

assert.match(html, /<!doctype html>/i, "index.html must declare HTML5");
assert.match(html, /<\/html>\s*$/i, "index.html must close the root element");
assert.match(
  html,
  /href=["']\.\/assets\/css\/portal\.css["']/i,
  "portal stylesheet must be linked",
);
assert.match(
  html,
  /<script\s+src=["']\.\/assets\/js\/portal\.js["'][^>]*><\/script>/i,
  "portal application script must be linked",
);
assert.ok(css.trim().length > 0, "portal stylesheet must not be empty");
assert.ok(logo.byteLength > 100, "club logo asset must exist");
assert.match(
  html,
  /src=["\']\.\/assets\/images\/club-logo\.jpg["\']/i,
  "club logo must be a separate asset",
);

const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const inlineScripts = scriptTags.filter(([, attributes]) => !/\bsrc\s*=/.test(attributes));
assert.equal(inlineScripts.length, 0, "application code must stay in its external source file");
new vm.Script(app, { filename: "assets/js/portal.js" });

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(([, id]) => id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicates)], [], "HTML element IDs must be unique");

assert.match(
  app,
  /const SUPABASE_URL\s*=\s*["']https:\/\/[a-z0-9]+\.supabase\.co["']/i,
  "Supabase URL must point to HTTPS",
);
assert.match(
  app,
  /const SUPABASE_KEY\s*=\s*["']sb_publishable_[^"']+["']/,
  "browser client must use a publishable key, never a server secret",
);
assert.doesNotMatch(
  app,
  /sb_secret_[A-Za-z0-9_-]+|service_role["'\s:=]+[A-Za-z0-9_-]{20,}/i,
  "server-side Supabase credentials must not appear in the public app",
);

console.log(
  `Portal checks passed: external CSS/JS, valid JavaScript, ${ids.length} unique IDs, HTTPS Supabase configuration, and no server secret.`,
);
