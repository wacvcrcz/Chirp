# Chirp

X-style microblog. English-first, global. Arabic/Darija and RTL are first-class, not an afterthought. Posts are called "chirps". Read `docs/01-product-spec.md` before changing behavior.

## Stack
Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui (Radix, RTL mode), TanStack Query, Zustand, React Hook Form + Zod, next-intl, next-themes, Sonner. Supabase (Postgres, Auth, Storage), Drizzle ORM, Upstash Redis, Vercel. Details: `docs/02-architecture.md`.

## Commands
`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm e2e` · `pnpm build` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm check:rtl`

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

## Where things are
Spec `docs/01` · Architecture `docs/02` · Schema `docs/03` · API `docs/04` · Design `docs/05` · Feed and search `docs/06` · Media `docs/07` · Security `docs/08` · Phases `docs/09`. Read the relevant file when you start work on that area.
