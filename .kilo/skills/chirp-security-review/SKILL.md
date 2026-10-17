---
name: chirp-security-review
description: Security and abuse review checklist for Chirp. Use when asked to review a diff, endpoint, migration or phase for security, privacy, rate limiting or moderation gaps. Review only; do not change code unless asked.
---

# Chirp security review

Review the code in question against this checklist. Report each item as **pass**, **fail** or **not applicable**, with file and line for every failure, ordered by severity. Do not modify code unless asked.

## Checklist
- **Auth:** writes require a verified, non-suspended user via the server-verified user check; admin routes check `role = 'admin'` on the server.
- **Data access:** RLS enabled with no policies on new tables; service-role key only in server code and never `NEXT_PUBLIC_`; ownership checks on edit and delete.
- **Input:** every input validated with Zod; length limits enforced server-side; queries parameterized; `%` and `_` escaped for `ilike`.
- **Output:** user text rendered only as React text nodes; no `dangerouslySetInnerHTML`; links limited to http/https with safe `rel`.
- **Uploads:** signed URLs only, scoped to the user's folder; type, size and duration validated; stored size confirmed; orphans cleaned up.
- **Abuse:** a rate limit on every write; stricter limits for accounts under 24 hours old; spam heuristics (link-only bodies, repeats).
- **Moderation:** reports idempotent; admin actions write `moderation_actions`; suspended users excluded from feeds and search.
- **Headers and config:** security headers and CSP present; cron routes check `CRON_SECRET`; no secrets or full request bodies in logs.
- **Privacy:** no unnecessary personal data; impressions retained 30 days; account deletion removes chirps and media.

Details: `docs/08-security-moderation.md`.
