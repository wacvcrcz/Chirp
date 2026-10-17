# 02 Architecture

## Stack

Use the latest stable versions and check each library's current docs before using an API from memory.

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js App Router, React, TypeScript strict | SSR for public chirp pages and link previews |
| Styling | Tailwind CSS | Logical utilities for RTL |
| Components | shadcn/ui on Radix, initialized with `--rtl` | The CLI converts physical classes to logical ones |
| Server state | TanStack Query | Infinite queries, optimistic updates |
| Client state | Zustand | Composer draft, UI flags |
| Forms | React Hook Form + Zod | Schemas shared with the API |
| i18n | next-intl | `[locale]` route segment, ICU plurals (Arabic has several plural forms) |
| Theme | next-themes | Class strategy |
| Toasts | Sonner | |
| Database | Supabase Postgres | Pooled connection string from Vercel |
| ORM | Drizzle + drizzle-kit | SQL migrations stay the source of truth for triggers |
| Auth | Supabase Auth (email and password) | `@supabase/ssr` cookies |
| Storage | Supabase Storage | Public read bucket `media`, uploads via signed URLs |
| Cache and limits | Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) | HTTP-based, fits serverless |
| Jobs | Vercel Cron, optionally Upstash QStash | No BullMQ |
| IDs | `uuidv7` package | Generated in app code |
| Tests | Vitest, Playwright | RTL screenshots in 4 modes |
| Hosting | Vercel | Cloudflare in front of a custom domain is optional |

## Request flow

```
Browser
  ├─ Next.js pages (Vercel) ──► Server components / route handlers (/api/v1)
  │                                  ├─► Supabase Postgres (pooled, via Drizzle)
  │                                  ├─► Upstash Redis (cache, rate limits)
  │                                  └─► Supabase Auth (session cookie)
  └─ Direct upload (signed URL) ───► Supabase Storage
```

## Serverless constraints (design around these)

| Constraint | Consequence |
|---|---|
| Request bodies are small | Media never passes through the API; use signed upload URLs |
| No persistent processes | No BullMQ, no workers, no `setInterval`; use Cron and QStash |
| Many short-lived connections | Always use the pooled (transaction mode) connection string; keep queries short |
| Long-lived connections are limited | No SSE or WebSockets in the MVP; poll notifications (30 s) or use Supabase Realtime later |
| Cold starts | Keep route handlers lean; avoid heavy imports |
| Heavy media work | No server transcoding at launch; add an external worker only if needed |

## Folder layout

```
src/
  app/
    [locale]/
      (auth)/login signup verify reset
      (app)/layout.tsx page.tsx search notifications [username] chirp/[id] settings onboarding
      admin/reports
      dev/kitchen-sink            # visual QA page, disabled in production
    api/v1/...                    # route handlers
    api/cron/...                  # Vercel Cron targets
  components/
    ui/        # shadcn
    chirp/     # ChirpCard, ChirpText, Composer, MediaGrid, VideoPlayer, ...
    layout/    # AppShell, NavBar, TabBar, RightRail
    brand/     # Logo, Wordmark
  lib/
    db/        # drizzle client + schema.ts
    supabase/  # server.ts, client.ts, middleware.ts
    schemas/   # zod
    text/      # count, normalize, tokenize, detectLang
    feed/      # queries, scoring
    api.ts     # apiHandler, ApiError
    ids.ts rate-limit.ts cursor.ts
  i18n/ messages/en.json ar.json routing.ts
  styles/globals.css
drizzle/        # generated and hand-written SQL migrations
scripts/        # seed.ts, check-logical-props.mjs
e2e/
```

## Environment variables (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # name may differ in newer Supabase projects; check current docs
SUPABASE_SERVICE_ROLE_KEY=            # server only
DATABASE_URL=                         # pooled connection string
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
```

## Conventions
- **Server components** fetch the first page of data; client components take over for infinite scroll and mutations.
- **Errors** from API routes use one shape: `{ "error": { "code": "...", "message": "...", "fields": {} } }`.
- **Time** is stored as `timestamptz` (UTC) and formatted with `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` using the active locale plus `-u-nu-latn`.
- **Media URLs** are never stored; store storage paths and build URLs with a helper so the CDN or bucket can change.
- **Feature flags** are plain constants in `src/lib/flags.ts` until there is a reason for more.

## Deployment
1. Create a Supabase project; copy the pooled `DATABASE_URL` and keys.
2. Create the Upstash Redis database.
3. Import the repo into Vercel; set all environment variables for Preview and Production.
4. Add `vercel.json` crons for `/api/cron/media-cleanup` and `/api/cron/impressions-retention`; both check `Authorization: Bearer ${CRON_SECRET}`.
5. Run migrations against production before the first deploy of a schema change.
6. Turn on Supabase backups appropriate for your plan and test one restore.
