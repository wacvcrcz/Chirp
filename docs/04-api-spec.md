# 04 API spec

Base path: `/api/v1`. JSON in, JSON out. Auth uses the Supabase session cookie. Route handlers live in `src/app/api/v1/...`.

## Conventions

**Errors**
```json
{ "error": { "code": "too_long", "message": "This chirp is 312 characters. The limit is 280.", "fields": { "body": "too_long" } } }
```
Codes: `unauthorized` 401, `forbidden` 403, `not_found` 404, `validation` 422, `too_long` 422, `rate_limited` 429, `suspended` 403, `unverified` 403, `conflict` 409, `server` 500. Messages say what happened and how to fix it; no apologies.

**Pagination**: `?cursor=<opaque>&limit=20` (max 50). Response: `{ "items": [...], "nextCursor": "..." | null }`.

**Chirp object**
```json
{
  "id": "uuid", "body": "text", "lang": "ar", "createdAt": "ISO",
  "author": { "id": "uuid", "username": "salma_k", "displayName": "Salma K.", "avatarUrl": "..." },
  "media": [{ "id": "uuid", "kind": "image", "url": "...", "width": 1200, "height": 800, "placeholder": "...", "durationMs": null }],
  "likeCount": 48, "replyCount": 12, "likedByMe": true, "replyToId": null
}
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | yes | Current profile |
| PATCH | `/me` | yes | Update display name, bio, avatar, preferred languages |
| POST | `/me/onboard` | yes | Set handle, display name, topics; sets `onboarded_at` |
| GET | `/usernames/:u/available` | no | Handle availability |
| POST | `/chirps` | yes, verified | Create a chirp or reply (`replyToId`) |
| GET | `/chirps/:id` | no | One chirp |
| DELETE | `/chirps/:id` | yes (author) | Soft delete |
| GET | `/chirps/:id/replies` | no | Replies, oldest first |
| POST | `/chirps/:id/like` | yes | Like (idempotent) |
| DELETE | `/chirps/:id/like` | yes | Unlike (idempotent) |
| GET | `/feed/following` | yes | Chronological feed |
| GET | `/feed/for-you` | yes | Ranked feed |
| GET | `/users/:username` | no | Profile |
| GET | `/users/:username/chirps` | no | A user's chirps |
| POST | `/users/:username/follow` | yes | Follow (idempotent) |
| DELETE | `/users/:username/follow` | yes | Unfollow (idempotent) |
| GET | `/search?q=&type=chirps\|users` | no | Search |
| GET | `/notifications` | yes | Notifications, newest first, with `unreadCount` |
| POST | `/notifications/read` | yes | Mark all read |
| POST | `/media/upload-url` | yes, verified | Signed upload URL for one file |
| POST | `/impressions` | yes | Batch of `{chirpId, surface, dwellMs}` |
| POST | `/reports` | yes | Report a chirp or user |
| GET | `/suggestions/accounts?topics=a,b` | yes | Suggested accounts |
| GET | `/admin/reports?status=open` | admin | Report queue |
| POST | `/admin/reports/:id/resolve` | admin | `{ action: "dismiss" \| "remove_chirp" \| "suspend_user", note }` |
| POST | `/admin/users/:id/suspend` and `/unsuspend` | admin | Account suspension |
| GET | `/api/cron/media-cleanup` | cron secret | Remove orphaned uploads |
| GET | `/api/cron/impressions-retention` | cron secret | Delete old impressions |

Signup, login, verification and password reset use the Supabase client directly; they do not need custom endpoints.

## Rate limits (per user unless noted)

| Action | Limit |
|---|---|
| Create chirp or reply | 20 per hour (5 per hour for accounts under 24 hours old) |
| Like | 200 per hour |
| Follow | 60 per hour |
| Upload URL | 20 per hour |
| Report | 10 per hour |
| Search | 60 per minute (per IP when signed out) |
| Impressions | 30 requests per minute |

## Shared helpers

```ts
// src/lib/api.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export function apiHandler<T extends unknown[]>(fn: (req: Request, ...args: T) => Promise<Response>) {
  return async (req: Request, ...args: T) => {
    try {
      return await fn(req, ...args);
    } catch (e) {
      if (e instanceof ApiError)
        return NextResponse.json({ error: { code: e.code, message: e.message, fields: e.fields } }, { status: e.status });
      if (e instanceof ZodError)
        return NextResponse.json({ error: { code: 'validation', message: 'Some fields need fixing.', fields: Object.fromEntries(e.issues.map(i => [i.path.join('.'), i.code])) } }, { status: 422 });
      console.error(e);
      return NextResponse.json({ error: { code: 'server', message: 'Something went wrong. Try again in a moment.' } }, { status: 500 });
    }
  };
}
```

```ts
// src/lib/cursor.ts
export type Cursor = { t: string; id: string };
export const encodeCursor = (c: Cursor) => Buffer.from(JSON.stringify(c)).toString('base64url');
export const decodeCursor = (s: string): Cursor => JSON.parse(Buffer.from(s, 'base64url').toString());
```

```ts
// src/lib/ids.ts
import { uuidv7 } from 'uuidv7';
export const newId = () => uuidv7();
```

## Validation (shared with the client)

```ts
// src/lib/schemas/chirp.ts
import { z } from 'zod';

export const createChirpSchema = z.object({
  body: z.string().trim().max(2000),
  replyToId: z.string().uuid().optional(),
  mediaIds: z.array(z.string().uuid()).max(4).default([]),
}).refine(v => v.body.length > 0 || v.mediaIds.length > 0, { message: 'Write something or add media.', path: ['body'] });

export const handleSchema = z.string().regex(/^[a-z0-9_]{3,20}$/, 'Use 3-20 letters, numbers or underscores.');
```
The per-user character limit is checked in the handler (it depends on `max_chars`), using the grapheme counter from `06`.

## Example handler

```ts
// src/app/api/v1/chirps/route.ts
import { NextResponse } from 'next/server';
import { apiHandler, ApiError } from '@/lib/api';
import { requireVerifiedUser } from '@/lib/auth';
import { limiters, enforce } from '@/lib/rate-limit';
import { createChirpSchema } from '@/lib/schemas/chirp';
import { countChars } from '@/lib/text/count';
import { normalizeForSearch, detectLang } from '@/lib/text/normalize';
import { createChirp } from '@/lib/db/chirps';

export const POST = apiHandler(async (req) => {
  const user = await requireVerifiedUser();            // 401 / 403 unverified / 403 suspended
  await enforce(limiters.createChirp, user.id);        // 429
  const input = createChirpSchema.parse(await req.json());

  const n = countChars(input.body);
  if (n > user.maxChars)
    throw new ApiError(422, 'too_long', `This chirp is ${n} characters. The limit is ${user.maxChars}.`, { body: 'too_long' });

  const chirp = await createChirp({
    authorId: user.id,
    body: input.body,
    bodySearch: normalizeForSearch(input.body),
    lang: detectLang(input.body),
    replyToId: input.replyToId,
    mediaIds: input.mediaIds,
  });
  return NextResponse.json(chirp, { status: 201 });
});
```

## Auth helper (Supabase SSR)

Follow the current `@supabase/ssr` guide for Next.js; the shape is:

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}
```
`requireUser()` calls `supabase.auth.getUser()` (verifies with the auth server), loads the profile, and throws `ApiError` for missing, unverified or suspended users. Add the session-refresh middleware from the same guide.

## Testing the API
Vitest for pure logic (cursor, counting, normalization, schemas). Playwright for flows. For handlers, call the exported functions with a test database (Supabase local or a throwaway schema) and assert status codes and error shapes.
