---
name: chirp-rtl-bidi
description: Rules for right-to-left and mixed Arabic/English text in Chirp. Use when writing or reviewing any component, layout, Tailwind class, icon, number or date format, or any element that shows user-written text.
---

# Chirp RTL and bidirectional text

Arabic/Darija and RTL are first-class in Chirp. Every screen must work in four modes: English light, English dark, Arabic light, Arabic dark.

## Rules
1. **Logical classes only.** Use `ms-` `me-` `ps-` `pe-` `start-` `end-` `text-start` `text-end` `border-s` `border-e` `rounded-s-` `rounded-e-`. Never `ml-` `mr-` `pl-` `pr-` `left-` `right-` `text-left` `text-right` `border-l` `border-r` `rounded-l-` `rounded-r-`.
2. **User text gets `dir="auto"`** (names, bodies, bios, replies). Each chirp sets its own direction.
3. **Handles, URLs and emails are `dir="ltr"`**; wrap in `<bdi>` inside RTL text.
4. **Flip only directional icons** (reply arrow, back, chevrons) with `rtl:rotate-180` or `rtl:-scale-x-100`. Do not flip hearts, bookmarks, play buttons. The logo mark flips as a whole by design.
5. **Numbers use Western digits.** Format with a locale ending in `-u-nu-latn`, for example `new Intl.NumberFormat('ar-u-nu-latn')`. Counts use `tabular-nums`.
6. **Times** go in `<time dateTime>` and use `Intl.RelativeTimeFormat` with the active locale plus `-u-nu-latn`.
7. **Layouts mirror** (nav rail, floating Chirp button at `end-5`, grid order). Never position with physical left/right.
8. `<html lang dir>` is set from the locale in the locale layout.

## Verify
- Run `pnpm check:rtl` (fails on physical classes; silence a true false positive with a `// rtl-ok` comment).
- Add or update a Playwright screenshot test covering the four modes for the screen you changed.
- Test with real strings: Arabic, Darija, English, and mixed text with a hashtag, a mention and a link.

Details: `docs/05-design-system.md` (RTL rules, accessibility).
