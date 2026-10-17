# 05 Design system

Design principle: spend boldness in one place. Canary yellow is the single loud element; everything around it is quiet, readable and direction-agnostic.

## Identity

**Logo mark.** A canary-yellow bird that is also a speech bubble: round body, head feather, amber beak, bubble-style tail. The mark **flips horizontally in RTL layouts** so the beak always points the way the text reads.

**Wordmark.** Lowercase `chirp`, Readex Pro SemiBold (600), letter-spacing -0.03em. The Arabic wordmark is open (it depends on the Arabic verb; see `DECISIONS.md`).

**App icon.** The mark on an Ink (`#14213D`) rounded square. Never put the canary mark on a canary background.

```tsx
// src/components/brand/Logo.tsx
export function LogoMark({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Chirp" className={`rtl:-scale-x-100 ${className}`}>
      <path d="M26 13c-1-6 3-10 9-10-2 3-2 7 1 10z" fill="#FFD23F" />
      <circle cx="30" cy="35" r="22" fill="#FFD23F" />
      <path d="M13 50L4 61l21-6z" fill="#FFD23F" />
      <path d="M51 30l11 5-11 6z" fill="#F2A900" />
      <circle cx="39" cy="29" r="3.2" fill="#14213D" />
      <path d="M18 38c4 8 14 10 21 4" fill="none" stroke="#14213D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-[-0.03em] text-2xl">
      <LogoMark /> chirp
    </span>
  );
}
```
`rtl:` needs `dir="rtl"` on `<html>`, which the locale layout sets.

## Color tokens

| Name | Hex | Role |
|---|---|---|
| Canary | `#FFD23F` | The one loud color: Chirp button, active tab underline, liked heart, logo |
| Amber | `#F2A900` | Beak only |
| Ink | `#14213D` | Text, and text on top of canary |
| Slate | `#5B6478` | Secondary text, timestamps |
| Mist | `#F3F5F9` | Light background |
| Night | `#0E1320` | Dark background |
| Zellige | `#0F7B6C` | Links and mentions (light); `#35C2AA` on dark |

Rules: canary is always a **fill with Ink on top**, never text on a light background. A liked heart is canary fill with an Ink outline so it stays visible on light. Posts are separated by divider lines, not cards.

```css
/* src/styles/globals.css (Tailwind v4 + shadcn variables) */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root {
  --background: #F3F5F9;  --foreground: #14213D;
  --card: #FFFFFF;        --card-foreground: #14213D;
  --popover: #FFFFFF;     --popover-foreground: #14213D;
  --primary: #FFD23F;     --primary-foreground: #14213D;
  --secondary: #E8ECF4;   --secondary-foreground: #14213D;
  --muted: #E8ECF4;       --muted-foreground: #5B6478;
  --accent: #E6F3F0;      --accent-foreground: #14213D;
  --destructive: #C62828;
  --border: #DCE1EA;      --input: #DCE1EA;
  --ring: #14213D;
  --link: #0F7B6C;
  --radius: 0.75rem;
}
.dark {
  --background: #0E1320;  --foreground: #E8EBF4;
  --card: #141B2D;        --card-foreground: #E8EBF4;
  --popover: #141B2D;     --popover-foreground: #E8EBF4;
  --primary: #FFD23F;     --primary-foreground: #14213D;
  --secondary: #1B2338;   --secondary-foreground: #E8EBF4;
  --muted: #1B2338;       --muted-foreground: #9099B0;
  --accent: #18302F;      --accent-foreground: #E8EBF4;
  --destructive: #EF6B6B;
  --border: #232B40;      --input: #232B40;
  --ring: #FFD23F;
  --link: #35C2AA;
}
@theme inline {
  --color-background: var(--background);  --color-foreground: var(--foreground);
  --color-card: var(--card);              --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);        --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);        --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);    --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);            --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);          --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);          --color-input: var(--input);  --color-ring: var(--ring);
  --color-link: var(--link);
  --font-sans: var(--font-readex), system-ui, "Segoe UI", Tahoma, sans-serif;
  --radius-lg: var(--radius);
}
```
If the generated shadcn setup differs from this structure, keep shadcn's structure and map these values into it.

## Typography

One family for Latin and Arabic so mixed chirps look like one voice. Candidate: **Readex Pro** (weights 400, 500, 600). Test real Arabic and Darija text before locking it in; IBM Plex Sans Arabic is the fallback choice.

```tsx
// src/app/[locale]/layout.tsx (excerpt)
import { Readex_Pro } from 'next/font/google';
const readex = Readex_Pro({ subsets: ['latin', 'arabic'], weight: ['400', '500', '600'], variable: '--font-readex', display: 'swap' });
// <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={readex.variable}>
```
Check the available subsets in the current font metadata. Body text 15-16 px with a 1.5-1.6 line height, line length under 80 characters, `font-variant-numeric: tabular-nums` on counts.

## Motion
- **One signature moment:** when a chirp is posted, a soft sound-wave pulse ripples out of the Chirp button (CSS keyframes, about 400 ms).
- Motion that answers an action is fine (heart fills, sheet opens). Nothing animates on its own, and no staggered entrances or hover effects on every card.
- Respect `prefers-reduced-motion`: replace the pulse with an instant state change.

## Layout
- **Mobile:** sticky header with logo and tabs (For you, Following), feed, bottom tab bar (Home, Search, Alerts, Profile), floating Chirp button at the end-bottom corner (`end-5 bottom-20`).
- **Desktop:** three columns. Start rail: logo, nav, Chirp button. Center: feed, max width about 600 px. End rail: search, who to follow, topics. Everything mirrors in RTL.
- Breakpoints: bottom bar below `md`; right rail from `lg`.

## Components

| Component | Notes |
|---|---|
| `ChirpCard` | Avatar at start; header (display name `dir="auto"`, `@handle` `dir="ltr"`, time); `ChirpText`; media; actions row. Divider below, no card chrome |
| `ChirpText` | Tokenizes text into plain, link, mention, hashtag; renders React nodes only |
| `ChirpActions` | Reply and like (bookmark later). 44px targets; counts use Western digits; like is optimistic |
| `Composer` | `<textarea dir="auto">`, grapheme counter ring, media picker with progress, Chirp button. Draft persists |
| `CharCounter` | Ring that fills; warns at 20 left; blocks at 0 with a clear message |
| `MediaGrid` | Fixed layouts for 1-4 images with reserved aspect ratios; placeholder while loading |
| `VideoPlayer` | Native `<video playsinline>`, muted autoplay when 60% visible, unmute control, poster |
| `FeedTabs` | For you / Following; remembers the last choice |
| `Feed` | TanStack infinite query; skeleton, empty, error states; sentinel for next page |
| `UserRow`, `FollowButton` | Follow is optimistic |
| `ProfileHeader` | Avatar, name, handle, bio, counts, follow button |
| `AppShell`, `TabBar`, `NavRail`, `RightRail` | Layout |
| `ReportDialog` | Reason select plus optional text |
| `EmptyState` | Always offers an action |
| `TopicPicker` | Onboarding multi-select |

States for every component: loading, empty, error, and (where relevant) offline or failed-to-send.

```tsx
// ChirpCard skeleton using logical classes only
<article className="flex gap-3 border-b border-border px-5 py-3.5">
  <Avatar className="size-11 shrink-0" />
  <div className="min-w-0 flex-1">
    <header className="flex flex-wrap items-baseline gap-x-1.5">
      <span dir="auto" className="font-semibold">{author.displayName}</span>
      <bdi dir="ltr" className="text-sm text-muted-foreground">@{author.username}</bdi>
      <time className="text-sm text-muted-foreground" dateTime={createdAt}>{relative}</time>
    </header>
    <ChirpText body={body} />
    <MediaGrid media={media} />
    <ChirpActions chirp={chirp} />
  </div>
</article>
```

```ts
// src/lib/text/tokenize.ts
export type Token = { type: 'text' | 'url' | 'mention' | 'hashtag'; value: string };
const RE = /(https?:\/\/[^\s]+)|(@[a-z0-9_]{3,20})|(#[\p{L}\p{N}_]{1,50})/giu;

export function tokenize(input: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of input.matchAll(RE)) {
    if (m.index! > last) out.push({ type: 'text', value: input.slice(last, m.index) });
    out.push({ type: m[1] ? 'url' : m[2] ? 'mention' : 'hashtag', value: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < input.length) out.push({ type: 'text', value: input.slice(last) });
  return out;
}
```
Render tokens as React elements. Links get `rel="noopener noreferrer nofollow ugc"` and only `http(s)` is allowed.

## RTL rules (checklist)
1. Logical properties only: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `border-s`, `rounded-s-`.
2. User text gets `dir="auto"`; handles and URLs are `dir="ltr"` (use `<bdi>`).
3. Flip only directional icons (reply arrow, back, chevrons) with `rtl:rotate-180` or `rtl:-scale-x-100`. Do not flip hearts, bookmarks, play buttons or the logo's content (the logo mark as a whole flips by design).
4. Numbers and times in `<time>`/`<bdi>`; format with a locale plus `-u-nu-latn`.
5. Test every screen in four modes: English light, English dark, Arabic light, Arabic dark.

```js
// scripts/check-logical-props.mjs  (run as `pnpm check:rtl`)
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execSync("git ls-files 'src/**/*.tsx'", { encoding: 'utf8' }).split('\n').filter(Boolean);
const bad = /(?:^|[\s"'`:])-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|text-left|text-right|float-left|float-right)(?:-[\w[\]./%]+)?(?=[\s"'`])/;
let failed = false;
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes('rtl-ok')) return;
    if (/class(Name)?=|cn\(|clsx\(/.test(line) && bad.test(line)) { console.error(`${f}:${i + 1}  ${line.trim()}`); failed = true; }
  });
}
process.exit(failed ? 1 : 0);
```
Heuristic: silence a legitimate false positive with a `// rtl-ok` comment on the line.

## Accessibility checklist
- Real `<button>` and `<a href>`; never `onClick` on a div.
- Inputs have visible labels; icon-only buttons have `aria-label`.
- Text contrast 4.5:1 (3:1 at 24 px and up). Canary is never used as text on light backgrounds.
- Focus ring visible on both themes (Ink on light, canary on dark); 44px minimum touch targets.
- Images have alt text (prompt authors to add it); video has a mute control and works on mute.
- `prefers-reduced-motion` honored; layout works at phone width and 200% zoom.

## Copy and voice
Sentence case, plain verbs, active voice. Same name for an action everywhere. Errors say what happened and how to fix it. Empty states invite an action.

| Key | English | Arabic (placeholder, native review needed) |
|---|---|---|
| `chirp.action` | Chirp | زقزق |
| `chirp.done` | Chirped | (decide together with the Arabic verb) |
| `feed.forYou` | For you | لك |
| `feed.following` | Following | أتابعهم |
| `nav.home` | Home | الرئيسية |
| `nav.search` | Search | بحث |
| `nav.alerts` | Alerts | الإشعارات |
| `nav.profile` | Profile | حسابي |
| `video.tooLong` | This video is {seconds} seconds. Trim it to 30 seconds or less. | (translate) |
| `empty.following` | You are not following anyone yet. Pick a few accounts to fill this feed. | (translate) |

Do not ship the Arabic strings until a native speaker has reviewed them, and decide the Arabic verb for "chirp" first.
