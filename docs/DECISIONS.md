# Decisions

Add a line when you decide something. Newest at the bottom of each table.

## Decided (by the owner)

| Area | Decision |
|---|---|
| Name | Chirp. A post is a "chirp"; the verb is "to chirp" |
| Audience | Global, English-first launch |
| Edge over X | Better Arabic/Darija and RTL support |
| Product style | Same as X: public timeline |
| Algorithm | Smart "For you" feed like X, built in stages (see `06`) |
| Launch | Seed community first |
| Post length | Short default (MVP). Longer posts for premium later |
| MVP reactions | Likes and replies only |
| Auth | Email and password only |
| After MVP | Bookmarks first, then premium |
| Video | 30 seconds maximum, small files |
| Moderation | Report button plus a simple admin panel |
| Verification | None at launch |
| Database | Postgres plus Redis cache |
| Media storage | Supabase Storage |
| Hosting | Vercel plus a managed database (Supabase) |
| Digits | Western digits (0-9) everywhere, including the Arabic UI |
| Visual identity | Canary/ink palette, Readex Pro, bird-and-bubble mark that flips in RTL (see `05`) |

## Assumed (confirm before the phase that depends on them)

| Area | Assumption | Needed by |
|---|---|---|
| API | Next.js route handlers on Vercel, no separate Fastify service | Phase 0 |
| Auth provider | Supabase Auth for email and password | Phase 3 |
| ORM | Drizzle on Supabase Postgres via the pooled connection | Phase 2 |
| UI foundation | shadcn/ui on Radix | Phase 0 |
| Composer | Plain `<textarea dir="auto">`, mentions and hashtags parsed on display | Phase 4 |
| Handles | Latin letters, digits, underscore; 3-20 characters; stored lowercase | Phase 3 |
| Default limit | 280 graphemes; links count as 23; media does not count | Phase 4 |
| Media mix | Up to 4 images, or 1 video, not both | Phase 6 |
| Video | No server-side transcoding at launch; validate type, size, duration | Phase 6 |
| Typeface | Readex Pro (test with real Arabic and Darija text first) | Phase 1 |
| shadcn preset | `radix-nova` via `shadcn init --rtl --base radix -p nova`; `utils.ts` re-exports from the `cn` package (shadcn's drop-in for clsx + tailwind-merge) | Phase 0 |
| Supabase keys | `.env.example` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`; legacy anon/service_role keys are deprecated by end of 2026 | Phase 0 |
| Test environment | Vitest runs in `node` (no jsdom yet); browser-level tests go to Playwright | Phase 0 |
| Locale routing | `localePrefix: "always"` (every path is `/en/...` or `/ar/...`); next-intl middleware lives in `src/proxy.ts` because Next 16 renamed the middleware convention to proxy | Phase 1 |
| Locale rendering | Locale routes set `instant = false` (cacheComponents): `<html lang dir>` needs `await params`, which Cache Components treats as blocking above any Suspense boundary. Revisit with parallel routes if a route needs a static shell | Phase 1 |
| Design tokens | Brand constants `--canary --amber --ink --mist --night --slate --zellige` with semantic tokens mapped on top; shadcn's `link` button variant points at `--link` (docs/05 says canary is fill-only, shadcn defaulted to `text-primary`) | Phase 1 |
| Kitchen sink | `/[locale]/dev/kitchen-sink` wrapped in the real `AppShell`; returns 404 in production; Playwright captures four screenshots into `test-results/screenshots/` | Phase 1 |
| Migrations | `supabase/migrations/<timestamp>_*.sql` is the single source; the Supabase CLI (`link`, `db push`) is the only runner. No custom runner and no `_chirp_migrations` table | Phase 2 |
| DB driver | `postgres` (postgres.js) with `prepare: false` for the pooled connection, via `drizzle-orm/postgres-js`; `tsx` runs seed and unseed. Pool size via `DB_POOL_SIZE` (app default 1, scripts 5) | Phase 2 |
| Database tests | Run only via `pnpm test:db` (`RUN_DB_TESTS=1`) against the hosted dev project. Each test creates confirmed `test-<uuid>@example.com` users through the admin API, asserts on its own rows and deletes those users in `finally`; no TRUNCATE. A guard refuses to run when the project ref equals `PRODUCTION_PROJECT_REF`; when it is unset, commands warn and proceed | Phase 2 |
| Seed and unseed | `db:seed` and `db:unseed` refuse to run against `PRODUCTION_PROJECT_REF`. Seed accounts use `@example.test` with no usable password; `db:unseed` deletes only those accounts and their cascaded data | Phase 2 |
| Time-sortable seed ids | uuidv7 only accepts the current time, so the seed rewrites the first 48 bits with each chirp's timestamp. Live code uses plain `uuidv7()` | Phase 2 |

## Open

| Question | Notes |
|---|---|
| Arabic UI strings, including the Arabic word for "chirp" | Mockup strings are placeholders; a native speaker must review `ar.json` |
| Arabic wordmark | Depends on the Arabic verb |
| Domain, handles, trademark | Check `chirp` variants before building the brand further |
| Premium pricing and limits | After MVP |
| Automated moderation (hash matching, filters) | After the admin panel exists |
| Server-side video transcoding | Add a worker only if real device problems appear |
| Moving media to Cloudflare R2 | Only if Supabase bandwidth gets expensive; store paths, never full URLs |

## Log

| Date | Change |
|---|---|
| 2026-10-15 | Initial decisions captured from planning |
| 2026-10-17 | Phase 0 scaffold: Next.js 16.4 (Turbopack, Cache Components), shadcn `radix-nova` RTL, strict TS, Vitest + Playwright, CI workflow; no features built |
| 2026-10-17 | Phase 2: hand-written SQL in `supabase/migrations`, Drizzle mirror, postgres.js client, Arabic search utilities, guarded seed, non-destructive trigger/schema/RLS tests |
| 2026-10-17 | Phase 2 cleanup: hosted dev project is the only database (no Docker or Supabase local). CLI `link` + `db push` replaced the custom runner; the six migrations were marked applied with `supabase migration repair --status applied --linked <versions>` and `_chirp_migrations` was dropped. Tests are non-destructive and guarded by `PRODUCTION_PROJECT_REF` |
| 2026-10-17 | Phase 1: design tokens, Readex Pro, next-themes, `[locale]` routing (en/ar), logo, app shell, settings toggles, dev kitchen sink, four-mode screenshots. Arabic UI strings remain placeholders pending native review |
