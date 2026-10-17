---
name: chirp-arabic-text
description: Text utilities for Chirp: counting characters, Arabic normalization for search, language detection and tokenizing mentions, hashtags and links. Use when working on the composer, character limits, search, or chirp rendering.
---

# Chirp text utilities

Code lives in `src/lib/text/`. Use the same functions on client and server.

- **`countChars(text)`** counts graphemes with `Intl.Segmenter`; links count as 23; media does not count. Never use `.length`.
- **`normalizeForSearch(text)`** applies NFKC, removes Arabic diacritics and tatweel, merges alef variants (أ إ آ ٱ to ا), ى to ي, ة to ه, Persian kaf and yeh variants, lowercases, strips Latin accents, collapses spaces. Normalize queries the same way as stored text.
- **`detectLang(text)`** returns `ar | en | fr | other` using the Arabic-versus-Latin letter ratio plus a few French hints. It is a heuristic; keep it simple.
- **`tokenize(text)`** splits into text, url, mention (`@` + 3-20 of `a-z0-9_`), and hashtag (`#` + Unicode letters, numbers, underscore). Render tokens as React nodes only. Links allow only http and https, with `rel="noopener noreferrer nofollow ugc"`.
- **Arabizi** (Latin Darija such as 3lach) is a later, query-side boost only: map 2 to ء, 3 to ع, 5 to خ, 7 to ح, 8 to غ, 9 to ق. It is heuristic, not exact.

## Tests that must exist (Vitest)
`أحمد`, `احمد` and `إحمد` normalize equal; `مدرسة` equals `مدرسه`; diacritics and tatweel are ignored; emoji and combined characters count correctly; hashtags in Arabic tokenize; a URL followed by punctuation tokenizes correctly.

Details: `docs/06-feed-ranking-search.md`, `docs/05-design-system.md`.
