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
