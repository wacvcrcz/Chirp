---
name: chirp-design-system
description: Chirp visual identity, color tokens, typography, component rules, motion and copy voice. Use when building or restyling UI, adding a component, choosing colors or fonts, or writing interface text in Chirp.
---

# Chirp design system

Spend boldness in one place: canary yellow is the single loud element. Everything else is quiet.

## Tokens
Canary `#FFD23F` (loud color) - Amber `#F2A900` (logo beak only) - Ink `#14213D` (text) - Slate `#5B6478` (secondary text) - Mist `#F3F5F9` (light bg) - Night `#0E1320` (dark bg) - Zellige `#0F7B6C` (links; `#35C2AA` on dark). Use the CSS variables in `src/styles/globals.css`, never raw hex in components.

## Rules
- Canary is always a **fill with Ink text on top**. Never canary text on a light background.
- A liked heart is canary fill with an Ink outline.
- **Posts are separated by divider lines, not cards.** No identical rounded-card grids, no decorative gradients, no emoji as icons.
- Type: one family (Readex Pro) for Latin and Arabic; body 15-16px, line height 1.5-1.6, line length under 80 characters.
- Motion: one signature moment (the sound-wave pulse when a chirp is posted, about 400 ms). Otherwise only motion that answers a user action. Respect `prefers-reduced-motion`.
- Accessibility: real `<button>`/`<a>`, labels on inputs, `aria-label` on icon-only buttons, visible focus (Ink on light, canary on dark), 44px touch targets, text contrast 4.5:1.
- Every component has loading, empty and error states.

## Components
ChirpCard, ChirpText, ChirpActions, Composer, CharCounter, MediaGrid, VideoPlayer, FeedTabs, Feed, UserRow, FollowButton, ProfileHeader, AppShell, ReportDialog, EmptyState, TopicPicker. Build on shadcn/ui; keep logical classes.

## Copy
Sentence case, plain verbs, active voice. The same action keeps the same name everywhere ("Chirp" then "Chirped"). Errors say what happened and how to fix it, with no apology. Empty states invite an action. Arabic strings need native review.

Details: `docs/05-design-system.md`.
