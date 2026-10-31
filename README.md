# CPSCRDC Debating Club Portal

Public, member, and editor portal for the Cantonment Public School and College Rangpur Debating Club. The site is a static GitHub Pages application backed by Supabase.

## Start locally

Use Node.js 22 or newer.

```sh
npm ci
npm run check
npm run format:check
python -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173). A local web server is needed because the portal loads its Supabase client and app assets from the browser. The public pages can be explored without signing in; member and editor checks require accounts with those roles.

To format changed files, run `npm run format`. Before opening a pull request, run `npm run check` and `npm run format:check`.

## Project layout

- `index.html` contains the page structure and navigation.
- `assets/css/portal.css` contains the portal's styles and responsive layouts.
- `assets/images/club-logo.jpg` stores the club logo as a standalone image.
- `assets/js/portal.js` contains the browser application. It remains a classic script because the page's accessible controls use inline event attributes that call global functions.
- `scripts/check.mjs` validates the HTML shell, local asset links, JavaScript syntax, unique element IDs, and public Supabase configuration.
- `scripts/ping-supabase.mjs` checks the Supabase Auth health endpoint for the scheduled workflow.
- `supabase/migrations/` contains reviewed database policy and function changes.
- `.github/workflows/` contains code checks and the scheduled Supabase health check.

The app uses the Supabase publishable key in the browser. Publishable keys are intended for public clients; database access must remain protected by row-level security. Never put a Supabase secret or service-role key in this repository.

## Deploy

GitHub Pages serves the static site. Changes intended for release should go through a pull request to `main`, where the required code checks run. Confirm the repository's Pages source and branch protection in GitHub Settings; those account-level settings are not represented by files in this repository.

## Manual verification

Follow [the manual test checklist](docs/manual-test-checklist.md) for public, member, editor, mobile, and dark-mode checks. Also review the browser console and network panel when verifying a change that touches navigation, Supabase access, or page rendering.
