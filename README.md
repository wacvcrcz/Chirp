# Chirp

An X-style microblog for a global, English-first audience, with first-class Arabic/Darija and right-to-left (RTL) support as its main edge. Users post short "chirps" (text, images, 30-second video), follow people, like and reply, and read a chronological **Following** feed or a ranked **For you** feed.

This folder is the build kit: product spec, architecture, schema, API, design system, and a phased prompt plan for building the app with an AI coding agent in VS Code.

## How to use this kit

1. Copy `CLAUDE.md` and `docs/` to the root of your empty repo.
2. Open the repo in VS Code and start your AI agent in the repo root. The agent reads `CLAUDE.md` automatically; it is deliberately short and points to `docs/` for the details.
3. Work through `docs/09-prompt-phases.md` one phase at a time, using its prompts. One phase per branch and per agent session.
4. For each phase: ask for a plan first, review it, then let the agent build. Run the checks listed in the phase, review the diff, commit, and update `docs/DECISIONS.md` if anything was decided.

## Doc map

| File | What it is for |
|---|---|
| `CLAUDE.md` | Short standing rules for the agent (stack, commands, non-negotiables) |
| `docs/DECISIONS.md` | What is decided, what is assumed, what is still open |
| `docs/01-product-spec.md` | Scope, limits, user stories, acceptance criteria |
| `docs/02-architecture.md` | Stack, hosting constraints, folder layout, environment |
| `docs/03-database-schema.md` | Postgres schema (SQL), triggers, indexes, security |
| `docs/04-api-spec.md` | Endpoints, conventions, handler and validation snippets |
| `docs/05-design-system.md` | Logo, tokens, type, components, RTL and accessibility rules |
| `docs/06-feed-ranking-search.md` | Feed queries, For-you scoring, impressions, Arabic search |
| `docs/07-media-pipeline.md` | Image and video upload, limits, cleanup |
| `docs/08-security-moderation.md` | Security checklist, rate limits, reports, admin panel |
| `docs/09-prompt-phases.md` | The build plan: copy-paste prompts per phase |

## Target repo layout

```
CLAUDE.md
docs/
src/
  app/[locale]/(auth)/ (app)/ admin/     # pages
  app/api/v1/                            # route handlers
  components/ui/ chirp/ layout/ brand/
  lib/db/ supabase/ schemas/ text/ feed/ ids.ts rate-limit.ts
  i18n/messages/en.json ar.json
drizzle/                                  # migrations
scripts/ e2e/
```

## Status

Design mockups (feed screens in English and Arabic, light and dark, logo, identity board) live in the Claude artifact built during planning. Everything in `docs/` reflects the decisions made there. Items marked **Assumption** in `docs/DECISIONS.md` should be confirmed before the phase that depends on them.
