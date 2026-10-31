# Contributing

1. Start a branch from the latest `main`.
2. Make the smallest change that addresses the issue and preserve the existing public/member/editor access rules.
3. Run `npm ci`, `npm run check`, and `npm run format:check`. Use `npm run format` to apply the shared formatting rules.
4. For user-facing changes, follow the relevant parts of [the manual test checklist](docs/manual-test-checklist.md).
5. Open a pull request to `main` and describe the behavior changed and the checks performed.

Database changes belong in timestamped SQL migrations under `supabase/migrations/`. Keep row-level security enabled on exposed tables, review Supabase security and performance advisors, and document any required dashboard setting changes in the pull request.
