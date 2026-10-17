# 09 Prompt phases

A phased plan for building Chirp with an AI coding agent in VS Code. Each phase has a goal, a prompt to paste, and a "done when" list.

## How to run a phase

1. New branch and a fresh agent session per phase (`git switch -c phase-4-chirps`). Long sessions fill the context window and quality drops.
2. Start in **plan mode** (in Claude Code, Shift+Tab cycles modes; check the docs for your version). Paste the prompt, read the plan, fix mistakes, then approve.
3. Let the agent build in small steps with a commit after each one.
4. Run the checks yourself: `pnpm typecheck && pnpm lint && pnpm test && pnpm check:rtl` (and `pnpm e2e` when the phase adds flows).
5. Review the diff. Ask for fixes in the same session.
6. Add any new decision to `docs/DECISIONS.md`, merge, and move on.

Rules for good results: one phase at a time; point the agent at the exact doc sections; keep `CLAUDE.md` short; never let it add dependencies silently; ask it to say when a doc and the code disagree.

## Prompt template

```text
Read CLAUDE.md and <docs to read>.
Goal: <one sentence>.
Scope: <what to build>. Out of scope: <what not to touch>.
Constraints: follow CLAUDE.md rules; no new dependencies unless listed in docs/02-architecture.md.
Process: first give me a plan (files to create or change, in order, with risks). After I approve, build in small commits.
Done when: <checks>. Finish by listing what you changed, what you did not do, and any decision that should go in docs/DECISIONS.md.
```

---

## Phase 0: Bootstrap

**Goal:** an empty repo that builds, lints, tests and deploys.

```text
Read CLAUDE.md and docs/02-architecture.md.
Goal: scaffold the project with the stack in docs/02. Do not build features.
Do:
- pnpm workspace-free single app; Next.js App Router, TypeScript strict, Tailwind, ESLint, Prettier.
- Initialize shadcn/ui with RTL enabled (shadcn init --rtl) using Radix; add button, input, textarea, avatar, tabs, dialog, sheet, dropdown-menu, skeleton, sonner.
- Install: @tanstack/react-query, zustand, react-hook-form, zod, next-intl, next-themes, drizzle-orm, drizzle-kit, @supabase/ssr, @supabase/supabase-js, @upstash/redis, @upstash/ratelimit, uuidv7, browser-image-compression, vitest, @playwright/test.
- Create the folder layout from docs/02, .env.example, and package.json scripts: dev, build, typecheck, lint, test, e2e, db:generate, db:migrate, db:seed, check:rtl.
- Add scripts/check-logical-props.mjs from docs/05.
- Add a GitHub Actions workflow running typecheck, lint, test, check:rtl and build.
Constraints: confirm each package name and current API in its docs instead of relying on memory.
Done when: pnpm typecheck, lint, test, check:rtl and build all pass on a clean clone; the home page renders.
```

## Phase 1: Design foundation and app shell

**Goal:** tokens, fonts, themes, locales, logo and the responsive shell, verifiable in four modes.

```text
Read CLAUDE.md and docs/05-design-system.md.
Goal: implement the design foundation and an empty app shell.
Do:
- globals.css with the color tokens from docs/05 (light and dark), Readex Pro via next/font (latin + arabic subsets), tabular-nums utilities.
- next-themes (class strategy) and next-intl with a [locale] segment for en and ar; set <html lang dir> from the locale; messages/en.json and ar.json with the nav and feed strings from docs/05 (Arabic values are placeholders).
- LogoMark and Logo components from docs/05 (the mark flips in RTL).
- AppShell: mobile header with For you / Following tabs, bottom tab bar, floating Chirp button at the end-bottom; desktop three-column layout with start rail, feed column and end rail.
- Theme toggle and language toggle in settings placeholder.
- /dev/kitchen-sink page (dev only) showing tokens, buttons, tabs, a sample ChirpCard with English, Arabic and mixed text, in the current theme and locale.
- The Chirp pulse animation on the Chirp button (CSS keyframes, 400 ms), disabled under prefers-reduced-motion.
Constraints: logical Tailwind classes only; no cards around posts; canary only as a fill with ink text.
Done when: I can view the kitchen sink in English light, English dark, Arabic light, Arabic dark and everything mirrors correctly; pnpm check:rtl passes; a Playwright test captures all four screenshots.
```

## Phase 2: Database

**Goal:** the schema, triggers and seed data.

```text
Read CLAUDE.md and docs/03-database-schema.md.
Goal: implement the database exactly as docs/03 defines.
Do:
- Hand-written SQL migrations for extensions, enums, tables, indexes, the auth.users profile trigger, counter triggers and RLS (no policies).
- Drizzle schema in src/lib/db/schema.ts mirroring the tables, and a db client using DATABASE_URL (pooled connection; no prepared-statement assumptions).
- scripts/seed.ts: 50 users, 400 chirps in Arabic, Darija, English and mixed text, follows, likes, replies, topics, suggested_accounts. Use uuidv7 ids and set body_search with normalizeForSearch and lang with detectLang (create src/lib/text/normalize.ts and count.ts from docs/06 first, with Vitest tests).
- Vitest tests (against a local or throwaway database) proving the counter triggers keep like_count, reply_count and follower counts correct on insert and delete.
Out of scope: auth UI, API routes.
Done when: migrations apply from scratch; seed runs; the trigger tests pass; the anon key cannot read any table (write a test or document the manual check).
```

## Phase 3: Auth and onboarding

**Goal:** signup, verification, login, reset and the profile onboarding.

```text
Read CLAUDE.md, docs/04-api-spec.md (auth helper, errors) and docs/01-product-spec.md (sign up story).
Goal: email and password auth with Supabase Auth and a profile onboarding flow.
Do:
- Supabase SSR clients (server, browser) and the session-refresh middleware per the current @supabase/ssr docs; requireUser and requireVerifiedUser helpers that throw ApiError.
- Pages: signup, login, verify-email notice, password reset request and reset, with React Hook Form + Zod, field errors, and copy that says what happened and how to fix it (en and ar).
- Onboarding (after verification): handle (with live availability check), display name, avatar upload placeholder, then redirect to the home page. Implement GET /usernames/:u/available, GET and PATCH /me, POST /me/onboard.
- Route protection: signed-out users can read public pages; posting and other writes require a verified, onboarded user.
- Rate limit the availability check.
Out of scope: topics, suggested accounts (Phase 10), avatar image processing (Phase 6).
Done when: Playwright covers signup, verification (use the local email inbox from Supabase local dev), onboarding, logout and login; unverified users are blocked from posting with a clear message.
```

## Phase 4: Chirps and the Following feed

**Goal:** create, read and delete chirps; read the Following feed with infinite scroll.

```text
Read CLAUDE.md, docs/04-api-spec.md, docs/05-design-system.md (ChirpCard, ChirpText, Composer) and docs/06-feed-ranking-search.md (Following feed, text utilities).
Goal: text chirps end to end.
Do:
- API: POST /chirps, GET /chirps/:id, DELETE /chirps/:id, GET /feed/following, GET /users/:username/chirps. Use apiHandler, cursor helpers, Zod schemas, the per-user max_chars check with countChars, rate limiting, and batched hydration of authors (no N+1 queries).
- UI: Composer (textarea dir="auto", CharCounter ring, draft persisted with Zustand, Chirp button with the pulse and a "Chirped" toast), ChirpCard, ChirpText with tokenize (mentions, hashtags, links), Feed with TanStack infinite query, skeletons, empty and error states.
- Home page: FeedTabs (For you shows a "coming soon" placeholder that falls back to Following for now); the empty Following state offers suggested accounts later.
- Tests: tokenize and countChars (Vitest), cursor round-trip, create-then-see-in-feed (Playwright).
Out of scope: media, likes, replies.
Done when: I can post in Arabic, English and mixed text, see correct direction per chirp, scroll 100+ seeded chirps without duplicates, and delete my own chirp.
```

## Phase 5: Likes, replies, follows and profiles

**Goal:** the social graph and interactions.

```text
Read CLAUDE.md, docs/04-api-spec.md, docs/05-design-system.md.
Goal: likes, replies, follow and profile pages.
Do:
- API: like and unlike (idempotent), replies via POST /chirps with replyToId plus GET /chirps/:id/replies, follow and unfollow (idempotent), GET /users/:username, profile update.
- UI: optimistic like with rollback and an error toast (update the infinite-query cache), reply composer and thread page (/chirp/[id]), FollowButton (optimistic), ProfileHeader, profile page with the user's chirps, counts with Western digits.
- Create notifications rows for likes, replies and follows in the same transaction as the action (no self-notifications).
Out of scope: the notifications UI (Phase 7), rechirps.
Done when: counts stay correct after rapid like/unlike and follow/unfollow; a failed request rolls back visibly; thread order and reply counts are correct; Playwright covers like, reply, follow.
```

## Phase 6: Media

**Goal:** images first, then 30-second video.

```text
Read CLAUDE.md, docs/07-media-pipeline.md and docs/05-design-system.md (MediaGrid, VideoPlayer).
Goal: media uploads and display. Do it in two commits: images, then video.
Do:
- POST /media/upload-url with validation and rate limits; Supabase buckets (media, avatars) public read; direct upload with signed tokens; confirm step in POST /chirps that checks the stored object size and attaches media.
- Client: image compression, video duration and size checks with the exact messages from docs/07, upload progress, remove-before-post, alt text field for images.
- Display: MediaGrid (1-4 images, reserved aspect ratios, ThumbHash or BlurHash placeholders), VideoPlayer (muted autoplay at 60% visibility, one at a time, unmute control, poster).
- Avatar upload using the same flow.
- /api/cron/media-cleanup and vercel.json cron entries; CRON_SECRET check.
Constraints: no media through API routes; no server transcoding.
Done when: image and video posts work on mobile widths; a 45-second video is rejected before upload with a clear message; orphaned uploads are removed by the cron (test the handler directly).
```

## Phase 7: Notifications and search

**Goal:** in-app notifications and Arabic-aware search.

```text
Read CLAUDE.md, docs/04-api-spec.md and docs/06-feed-ranking-search.md (search, normalization).
Goal: notifications page and search.
Do:
- GET /notifications (cursor, unreadCount) and POST /notifications/read; a Notifications page; unread badge in the nav that polls every 30 seconds while the tab is visible.
- GET /search for chirps and users using the SQL in docs/06 with normalized queries; search page with tabs (Chirps, People), debounced input, empty and error states.
- Vitest tests proving أحمد, احمد and إحمد find the same chirp, and that diacritics and tatweel are ignored.
Extension (only after the above passes): query-side Arabizi expansion from docs/06, behind a small function with tests using a list of real Darija words I will provide.
Done when: the Arabic matching tests pass; notifications appear for likes, replies and follows made by other seeded users.
```

## Phase 8: For you and impressions

**Goal:** the stage-1 ranked feed with impression logging.

```text
Read CLAUDE.md and docs/06-feed-ranking-search.md.
Goal: implement the stage-1 For you feed.
Do:
- POST /impressions (batched, rate limited) and the useImpression hook; log surface and dwell time.
- GET /feed/for-you using the candidate and scoring SQL from docs/06, diversity post-processing (max 2 consecutive per author, language interleaving), Redis caching of the ordered ID list for about 5 minutes with an index cursor, and the fallback when results are short.
- Make the score weights constants in one file so they are easy to tune.
- /api/cron/impressions-retention deleting rows older than 30 days.
- A small script that prints the top 20 For-you items for a seeded user with their score parts, for debugging.
Out of scope: ML models, embeddings.
Done when: For you differs from Following, favors recent and engaged chirps, does not repeat chirps already seen in the last 24 hours, and paging is stable.
```

## Phase 9: Moderation and rate limits

**Goal:** reports, the admin panel and consistent rate limiting.

```text
Read CLAUDE.md and docs/08-security-moderation.md.
Goal: ship the safety basics.
Do:
- POST /reports (idempotent per reporter and target) with ReportDialog on chirps and profiles.
- Admin: GET /admin/reports, POST /admin/reports/:id/resolve (dismiss, remove_chirp, suspend_user), suspend and unsuspend endpoints, all writing moderation_actions. Admin pages under /admin/reports with the queue, target preview, and action buttons with notes. Server-side role check on every admin route and page.
- Suspended users cannot write; their chirps are excluded from feeds and search.
- Audit every write endpoint for enforce(limiters.*) and for the new-account limits; add tests that exceeding a limit returns 429 with the message format from docs/04.
- Add the security headers and CSP in next.config.
Done when: an admin can act on a report end to end; every action appears in the audit log; non-admins get 403 on admin routes; the rate-limit tests pass.
```

## Phase 10: Onboarding and seed tooling

**Goal:** a first-run experience that makes the feed useful on day one.

```text
Read CLAUDE.md, docs/01-product-spec.md and docs/05-design-system.md (TopicPicker, EmptyState).
Goal: topic selection and suggested accounts after onboarding.
Do:
- TopicPicker step (multi-select from topics, English and Arabic names), saved to user_topics.
- GET /suggestions/accounts?topics=... using suggested_accounts, then a "Follow a few accounts" step with one-tap follow.
- An admin-only script or page to mark seed accounts as suggested for topics.
- Empty states for Following that link to suggestions.
- Seed-community tooling: a script that creates invite-ready placeholder content is out of scope; instead document in docs/ a short checklist for personally inviting the first 50-200 members.
Done when: a new account ends onboarding with a non-empty Following feed.
```

## Phase 11: Hardening and launch

**Goal:** quality, security and deployment.

```text
Read CLAUDE.md, docs/05-design-system.md (accessibility and RTL checklists), docs/08-security-moderation.md and docs/02-architecture.md (deployment).
Goal: prepare for a private launch.
Do:
- Accessibility pass against the checklist in docs/05 (keyboard, focus, labels, contrast, reduced motion) and fix findings.
- RTL and theme QA: Playwright screenshot tests of home, thread, profile, search, notifications and composer in the four modes; fix mirroring bugs.
- Performance: Lighthouse on mobile for home and a chirp page; fix image sizing, layout shift and bundle bloat.
- Security review against docs/08: list each item as pass, fail or not applicable, and fix failures.
- Legal pages (terms, privacy, community rules) as placeholders for me to replace, in English and Arabic, and an account deletion flow.
- Deployment: Vercel project settings, environment variables, cron jobs, Supabase backups, error monitoring, and a short runbook in docs/RUNBOOK.md.
Done when: the checks in this phase pass, the app deploys to a preview URL, and I have a written list of anything still open.
```

## After the MVP
- **Bookmarks:** the `bookmarks` table is in docs/03. Add endpoints, a Saved page and an action in `ChirpActions`.
- **Premium:** raise `max_chars` per plan and add a longer composer; no schema changes needed.
- **Rechirps and quotes, DMs, blocking and muting, hashtag trends.**

## Standing prompts

**Review a diff**
```text
Review my current diff against CLAUDE.md and the relevant docs. List violations (RTL classes, missing dir="auto", missing validation, N+1 queries, missing rate limits, accessibility) with file and line, ordered by severity. Do not change code yet.
```

**RTL audit of one screen**
```text
Audit <screen or component> for RTL and bidirectional text: physical classes, missing dir="auto", handles and numbers, icons that should or should not flip, and spacing. Fix what you find and add a Playwright screenshot in the four modes.
```

**Write tests for existing code**
```text
Write Vitest tests for <module> covering normal cases, edge cases (Arabic, mixed text, emoji, empty input) and failures. Do not change the module unless a test exposes a bug; if so, explain it first.
```

**Fix a failing check**
```text
Run pnpm typecheck, lint, test and check:rtl. Fix failures one at a time, root cause first, without disabling rules or weakening tests. Report what each failure was.
```

**Record a decision**
```text
Add a row to docs/DECISIONS.md for: <decision>. Update any doc that is now out of date and list what you changed.
```
