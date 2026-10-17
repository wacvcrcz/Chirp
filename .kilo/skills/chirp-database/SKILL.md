---
name: chirp-database
description: Chirp Postgres schema rules and migration workflow. Use when changing tables, indexes, triggers, RLS, Drizzle schema, seed data or any SQL query in Chirp.
---

# Chirp database

## Source of truth
`docs/03-database-schema.md` defines the schema. Migrations are hand-written SQL in `drizzle/`; mirror tables in `src/lib/db/schema.ts`. Triggers, extensions and RLS live only in SQL migrations.

## Rules
- Profiles use the auth user's id; a trigger creates the profile row. `username` is null until onboarding completes.
- Chirps are **soft-deleted** (`deleted_at`). Every read filters `deleted_at is null` and suspended authors.
- Counters (`like_count`, `reply_count`, follower counts) are maintained **by triggers**; never update them from app code.
- **RLS is enabled on every table with no policies.** All access goes through the server connection; authorization is checked in API code.
- Every list query has a supporting index and uses cursor pagination on `(created_at, id)`.
- Search uses `body_search` (normalized) with `pg_trgm`; always store `normalizeForSearch(body)` when creating a chirp.
- Escape `%` and `_` before `ilike`. Use parameterized queries or Drizzle `sql` templates; never string-concatenate user input.
- Use the pooled connection string; do not assume prepared statements.

## Adding a migration
1. Write the SQL migration (forward only), including indexes and RLS for any new table.
2. Update `schema.ts` and `docs/03-database-schema.md`.
3. Add or update seed data and a Vitest test for any trigger or constraint.
4. Run migrations from scratch on a clean database before committing.

Details: `docs/03-database-schema.md`, `docs/06-feed-ranking-search.md`.
