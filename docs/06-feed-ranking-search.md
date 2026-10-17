# 06 Feed, ranking and search

## Following feed (chronological)

Fan-out on read: query the chirps of people the user follows. Index: `chirps_author_time`.

```sql
select c.*
from chirps c
join follows f on f.followee_id = c.author_id and f.follower_id = $1
where c.deleted_at is null
  and c.reply_to_id is null
  and ($2::timestamptz is null or (c.created_at, c.id) < ($2, $3))
order by c.created_at desc, c.id desc
limit 21;                      -- fetch 21, return 20, the 21st decides nextCursor
```
Include the user's own chirps by unioning `author_id = $1`. Hydrate authors, media, `likedByMe` with batched queries (one query per relation, not per row).

## For you (ranked), staged

| Stage | When | Approach |
|---|---|---|
| 1 | Launch | Hand-written score over recent candidates (below) |
| 2 | A few thousand users | Add collaborative signals and topic affinity from likes, replies and `user_topics` |
| 3 | Enough interaction data | Train a ranking model (LightGBM first) on likes, replies, dwell |
| 4 | Scale | Embeddings plus approximate nearest neighbor for out-of-network discovery |

**Three steps at every stage:** candidate generation, scoring, then filtering and mixing.

### Stage 1 candidates and score

```sql
with candidates as (
  select c.*,
         (c.author_id in (select followee_id from follows where follower_id = $1))::int as is_followed
  from chirps c
  join profiles p on p.id = c.author_id
  where c.deleted_at is null
    and c.reply_to_id is null
    and p.suspended_at is null
    and c.author_id <> $1
    and c.created_at > now() - interval '48 hours'
    and not exists (
      select 1 from impressions i
      where i.user_id = $1 and i.chirp_id = c.id and i.seen_at > now() - interval '24 hours')
)
select *,
  ( (like_count * 1.0 + reply_count * 3.0 + 1)
    / power(extract(epoch from (now() - created_at)) / 3600.0 + 2, 1.4)
    * (case when is_followed = 1 then 1.5 else 1.0 end)
    * (case when coalesce(lang, 'other') = any($2::text[]) then 1.0 else 0.35 end)
  ) as score
from candidates
order by score desc, id desc
limit 200;                     -- $2 = the user's preferred languages
```
The numbers are starting points; tune them from real behavior.

### Mixing and paging
1. Take the top 200, then apply **diversity**: no more than 2 consecutive chirps from one author, and interleave Arabic and English according to the user's `preferred_langs`.
2. Cache the ordered ID list per user in Redis for about 5 minutes, and page through it with an index cursor. This keeps pages stable while scrolling and avoids rerunning the query.
3. If the result has fewer than 20 items, fall back to the newest public chirps in the user's languages so the feed is never empty.
4. Always label why a chirp is shown when it comes from outside the user's network ("Popular in Arabic today"), and keep a hook for a "Why am I seeing this?" label.

### Spam resistance in the ranker
Down-rank accounts under 24 hours old, accounts with a high report rate, and chirps with link-only bodies. Engagement scores are the first thing attackers game.

## Impressions (log from day one)

The ranker cannot learn what people ignored unless you record what they saw.

```ts
// src/lib/hooks/useImpression.ts
import { useEffect, useRef } from 'react';
const queue: { chirpId: string; surface: string; dwellMs: number }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  timer = null;
  if (!queue.length) return;
  const body = JSON.stringify({ items: queue.splice(0, 50) });
  if (!navigator.sendBeacon('/api/v1/impressions', new Blob([body], { type: 'application/json' })))
    fetch('/api/v1/impressions', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
}

export function useImpression(chirpId: string, surface: string) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let start = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) start = performance.now();
      else if (start) {
        const dwellMs = Math.round(performance.now() - start); start = 0;
        if (dwellMs >= 1000) { queue.push({ chirpId, surface, dwellMs }); timer ??= setTimeout(flush, 5000); }
      }
    }, { threshold: [0, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [chirpId, surface]);
  return ref;
}
```
Count an impression only after 50% visible for at least 1 second. Retention: delete rows older than 30 days.

## Text utilities

### Counting characters (graphemes)

```ts
// src/lib/text/count.ts
const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const URL_RE = /https?:\/\/[^\s]+/g;
const LINK_LENGTH = 23;

export function countChars(text: string): number {
  const withoutLinks = text.replace(URL_RE, '');
  const links = (text.match(URL_RE) ?? []).length;
  let n = 0; for (const _ of seg.segment(withoutLinks)) n++;
  return n + links * LINK_LENGTH;
}
```
Use the same function in the composer and the API.

### Arabic-aware normalization for search

```ts
// src/lib/text/normalize.ts
const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;   // tashkeel and Quranic marks
const TATWEEL = /\u0640/g;

export function normalizeArabic(s: string): string {
  return s
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ک/g, 'ك')   // Persian/Urdu kaf
    .replace(/ی/g, 'ي');  // Persian/Urdu yeh
}

export function normalizeForSearch(s: string): string {
  return normalizeArabic(s.normalize('NFKC'))
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')   // strip Latin accents
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectLang(s: string): 'ar' | 'en' | 'fr' | 'other' {
  const ar = (s.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  if (ar + latin < 3) return 'other';
  if (ar > latin) return 'ar';
  return /[éèêàçùâîôû]|\b(le|la|les|des|est|pour|avec)\b/i.test(s) ? 'fr' : 'en';
}
```
`detectLang` is a deliberately simple stage-1 heuristic (script ratio plus a few French hints). Replace it with a proper detector only if mislabeling hurts ranking.

Store `normalizeForSearch(body)` in `chirps.body_search` on every create. Normalize the query the same way before searching.

### Arabizi and Darija (Latin-letter Arabic)
People write Darija as "3lach", "wach", "7mdl". Start with a small mapping applied to the **query only**, to generate an extra Arabic-script candidate:

| Latin | Arabic | Latin | Arabic |
|---|---|---|---|
| 2 | ء | 5 / kh | خ |
| 3 | ع | 7 | ح |
| 9 | ق | 8 | غ |

This is heuristic: vowels and ambiguous letters will not map cleanly, so treat it as a recall boost, not exact matching. Add it in a later phase (see `09`, Phase 7 extension) and test it against a list of real Darija words.

## Search queries

```sql
-- chirps
select c.* from chirps c
where c.deleted_at is null
  and (c.body_search % $1 or c.body_search ilike '%' || $1 || '%')
order by similarity(c.body_search, $1) desc, c.created_at desc
limit 21;

-- users
select p.* from profiles p
where p.onboarded_at is not null and p.suspended_at is null
  and (p.username::text % $1 or p.display_name % $1 or p.username ilike $1 || '%')
order by greatest(similarity(p.username::text, $1), similarity(coalesce(p.display_name, ''), $1)) desc
limit 20;
```
Escape `%` and `_` in user input before using `ilike`. Hashtag search is a normal chirp search for the `#tag` text in the MVP. Move to Meilisearch or Typesense only when Postgres search is too slow or typo handling matters.

## Tests to write (Vitest)
- `normalizeArabic`: `أحمد`, `احمد` and `إحمد` normalize equal; diacritics and tatweel are removed; `مدرسة` equals `مدرسه`.
- `countChars`: emoji, combined Arabic letters, and links count as designed.
- `tokenize`: mentions, hashtags in Arabic, URLs followed by punctuation.
- Cursor round-trip, and a feed query test that checks stable paging with identical timestamps.
