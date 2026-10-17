# Chirp

X-style microblog. English-first, global. Arabic/Darija and RTL are first-class, not an afterthought. Posts are called "chirps". Read `docs/01-product-spec.md` before changing behavior.

## Stack
Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui (Radix, RTL mode), TanStack Query, Zustand, React Hook Form + Zod, next-intl, next-themes, Sonner. Supabase (Postgres, Auth, Storage), Drizzle ORM, Upstash Redis, Vercel. Details: `docs/02-architecture.md`.

## Commands
`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:db` · `pnpm e2e` · `pnpm build` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:unseed` · `pnpm check:rtl`

Run `typecheck`, `lint`, `test` and `check:rtl` before saying a task is done.

## Non-negotiable rules
- **RTL:** logical Tailwind classes only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). Never `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`.
- **User text:** every element showing user-written text has `dir="auto"`. Handles and URLs are `dir="ltr"`. Numbers use Western digits: format with a locale ending in `-u-nu-latn`.
- **Characters:** count graphemes with `Intl.Segmenter`, never `.length`. The limit comes from the user's `max_chars`, never a hard-coded 280.
- **IDs and paging:** UUIDv7 generated in app code. Cursor pagination on `(created_at, id)`, never offset.
- **Validation:** Zod schemas in `src/lib/schemas`, shared by client and server. Validate every API input.
- **Security:** never `dangerouslySetInnerHTML`. Service-role key is server-only. All tables have RLS on with no public policies; authorization is checked in API code.
- **Serverless:** no long-running processes, no BullMQ, no in-process timers. Use Vercel Cron or QStash. Media uploads go straight to Supabase Storage with signed URLs, never through an API route.
- **Design:** use tokens from `docs/05-design-system.md`. Canary yellow is only ever a fill with ink text on it. Posts are separated by dividers, not cards. One signature motion (the chirp pulse); everything else is quiet.
- **Copy:** sentence case, plain verbs, same name for an action everywhere ("Chirp" then "Chirped"). Errors say what happened and how to fix it, with no apology.
- **Accessibility:** real `<button>` and `<a>`, labels on inputs, `aria-label` on icon-only buttons, visible focus, 44px touch targets, respect `prefers-reduced-motion`.

## Working agreement
- Follow `docs/09-prompt-phases.md`. Plan first, then build in small commits.
- Do not add dependencies that are not in `docs/02-architecture.md` without asking.
- When you make or change a decision, add a line to `docs/DECISIONS.md`.
- If a doc and the code disagree, say so and ask which is right.

## Database (hosted dev project only)

There is no local Supabase and no Docker workflow. Development and tests use the hosted dev project. Credentials live in `.env` (git-ignored) and are read by the scripts; never open or echo that file.

```bash
npx supabase link --project-ref <dev project ref>   # once per clone
pnpm db:migrate                                     # supabase db push
pnpm db:seed                                        # 50 users, 400 chirps
pnpm db:unseed                                      # removes only @example.test seed accounts
pnpm test:db                                        # database suite, non-destructive
```

Rules:
- `supabase/migrations/` is the single source of truth. Write forward-only SQL, then `supabase db push`. Do not add a second migration runner or a second history table.
- Seeding and unseeding refuse to run when the project ref equals `PRODUCTION_PROJECT_REF`. Database tests apply the same guard and skip when `RUN_DB_TESTS` is not `1`. When `PRODUCTION_PROJECT_REF` is unset, seed, unseed and the tests warn and proceed; set it as soon as production exists.
- Database tests never truncate. Each test creates its own users through the admin API (`test-<uuid>@example.com`, confirmed) and deletes exactly those users in a `finally` block; cascades remove their rows.
- Tests assert on seeded data only through read-only queries. Do not depend on specific seed rows.
- Pool sizing: `DB_POOL_SIZE` overrides. The app defaults to 1 (serverless); scripts and tests default to 5.
- Manual RLS check: `set role anon; select count(*) from chirps;` in the SQL editor must fail, and the publishable key through PostgREST must return no rows.

## Never read, print or paste values from .env files

Do not `cat`, `grep`, `sed` or otherwise dump `.env`, `.env.local` or any variant, and never paste a key, password or connection string into chat, code, tests, logs, screenshots or commits. To diagnose configuration, print only derived, non-secret facts (hostname, port, project ref, whether a variable is set). `.env.example` documents names, never values.

## Where things are
Spec `docs/01` · Architecture `docs/02` · Schema `docs/03` · API `docs/04` · Design `docs/05` · Feed and search `docs/06` · Media `docs/07` · Security `docs/08` · Phases `docs/09`. Read the relevant file when you start work on that area.

## Skills
Project skills live in `.kilo/skills/`: chirp-rtl-bidi, chirp-design-system, chirp-api-conventions, chirp-database, chirp-arabic-text, chirp-media-uploads, chirp-security-review. Use the matching skill when working in that area.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
