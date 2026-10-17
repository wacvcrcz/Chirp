# 08 Security and moderation

A social platform with user-generated content attracts spam and abuse quickly. Build these controls with the MVP, not after launch.

## Security checklist

**Accounts and sessions**
- Supabase Auth handles password hashing, email verification and reset. Set a minimum password length of 8 and enable any leaked-password protection your plan offers.
- Unverified users can read but not post, upload or follow.
- Use `supabase.auth.getUser()` (server-verified) for authorization, not just a decoded cookie.
- Suspended users get a clear message and cannot write.

**Data access**
- RLS enabled on every table with no policies (see `03`). The anon key must not be able to read or write anything.
- The service-role key exists only in server code and server environment variables. Never prefix it with `NEXT_PUBLIC_`.
- Authorization lives in API code: authors edit and delete their own chirps; admins use `role = 'admin'`; every handler checks the user, not just the session.

**Input and output**
- Validate every input with Zod. Enforce length limits on the server.
- Render user text only as React text nodes. Never `dangerouslySetInnerHTML`.
- Links: allow only `http` and `https`; add `rel="noopener noreferrer nofollow ugc"`; do not auto-fetch link previews in the MVP.
- Escape `%` and `_` before `ilike` queries; use parameterized queries everywhere (Drizzle `sql` tagged templates).

**Uploads**
- Signed URLs only, scoped to the user's own folder; validate type, size and duration on the server; confirm the stored object size before marking media ready; clean up orphans.
- Strip EXIF location data from images (client compression usually does; verify and test it).

**Abuse and availability**
- Rate limits on every write (below). Return `429` with a clear message.
- Block obviously bad signups (disposable email domains) if abuse appears; add a CAPTCHA only if needed.
- Security headers in `next.config`: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and a Content-Security-Policy that allows your Supabase and font hosts.
- Never log tokens, passwords or full request bodies.

## Rate limiting

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ApiError } from '@/lib/api';

const redis = Redis.fromEnv();
const mk = (n: number, per: `${number} ${'s' | 'm' | 'h'}`, prefix: string) =>
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(n, per), prefix: `rl:${prefix}` });

export const limiters = {
  createChirp: mk(20, '1 h', 'chirp'),
  createChirpNew: mk(5, '1 h', 'chirp-new'),   // accounts under 24 hours old
  like: mk(200, '1 h', 'like'),
  follow: mk(60, '1 h', 'follow'),
  upload: mk(20, '1 h', 'upload'),
  report: mk(10, '1 h', 'report'),
  search: mk(60, '1 m', 'search'),
  impressions: mk(30, '1 m', 'imp'),
};

export async function enforce(limiter: Ratelimit, key: string) {
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
    throw new ApiError(429, 'rate_limited', `You are doing that too quickly. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }
}
```
Use `limiters.createChirpNew` instead of `createChirp` when `profile.created_at` is under 24 hours old.

## Reports

**User flow:** a chirp or profile menu has "Report". A dialog asks for a reason (spam, harassment, impersonation, graphic content, other) and optional detail. Show "Reported. A moderator will review it." Reporting twice for the same target is a no-op.

**Data:** `reports` (status `open`, `dismissed`, `actioned`) and `moderation_actions` (an audit log of every admin action).

## Admin panel (simple, MVP)

Route: `/admin/reports`, visible only to `role = 'admin'` (check on the server for every request, not just in the UI).

| Screen | Contents |
|---|---|
| Report queue | Open reports, oldest first; target preview (chirp text and media, or profile), reporter, reason, report count for the same target |
| Actions | Dismiss; remove chirp (soft delete); suspend user; unsuspend user; each takes an optional internal note |
| History | Moderation actions for a target; recent actions overall |

Every action writes a `moderation_actions` row with the admin id, target, report id and note. Removing a chirp sets `deleted_at` and (later) schedules media removal. Suspending sets `suspended_at`; a suspended user's chirps are excluded from feeds and search by the existing `suspended_at is null` filters.

## Spam heuristics (MVP)
- New-account write limits (above).
- Reject chirps that are only a link from accounts under 24 hours old, or that repeat an identical body more than twice in an hour.
- Rank down accounts with several open reports (see `06`).
- Review the report queue daily during the seed phase.

## Privacy and legal
- Terms of service, privacy policy and community rules pages exist before public launch, in English and Arabic.
- Account deletion: a settings action that deletes the profile, chirps and media. Document what is kept (moderation logs) and for how long.
- Do not collect more than needed: no phone numbers, no precise location. Impression data is retained for 30 days.
- Have a process for takedown requests and for reports that involve illegal content; get legal advice for your jurisdictions before opening the platform widely.

## After the MVP
Block and mute, hash-based matching for known harmful media, automated filters, appeals, moderator roles with scoped permissions, and verified accounts.
