---
name: chirp-api-conventions
description: Conventions for Chirp API route handlers under src/app/api/v1. Use when adding or changing an endpoint, validation schema, error response, pagination, auth check or rate limit.
---

# Chirp API conventions

## Handler shape
Wrap every handler in `apiHandler` (`src/lib/api.ts`). Order inside a write handler: authenticate (`requireVerifiedUser`), rate limit (`enforce(limiters.x, user.id)`), validate with a Zod schema from `src/lib/schemas`, apply business checks, do the work, return JSON.

## Errors
One shape: `{ "error": { "code", "message", "fields" } }`. Codes: unauthorized 401, forbidden 403, unverified 403, suspended 403, not_found 404, validation 422, too_long 422, rate_limited 429, conflict 409, server 500. Messages say what happened and how to fix it. Never leak internals or stack traces.

## Pagination
Cursor only: `?cursor=&limit=20` (max 50), response `{ items, nextCursor }`. Cursor encodes `(created_at, id)`; query with `(created_at, id) < ($t, $id)` and fetch limit + 1. Never offset.

## Rules
- IDs are UUIDv7 from `newId()`; never rely on database defaults for chirp ids.
- Character limits use `countChars` and the user's `max_chars`, never a hard-coded 280.
- Hydrate related data (authors, media, likedByMe) with batched queries; no N+1.
- Likes, follows and unlikes are idempotent.
- Create notification rows in the same transaction as the action; never notify yourself.
- Use the pooled `DATABASE_URL`; keep queries short; no long-running work in a request.
- Media never passes through the API; return signed upload URLs instead.
- Any new endpoint needs: a rate limit, a Zod schema, an error-case test, and a row in `docs/04-api-spec.md`.

Details: `docs/04-api-spec.md`.
