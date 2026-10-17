# 01 Product spec

## Vision
A fast, public microblog where Arabic, Darija and English speakers share one timeline and every script renders correctly. Chirp wins Arabic speakers by getting direction, search and typography right, and wins everyone else by being a clean X-style product.

## Audience and launch
- Global, English-first UI at launch. Arabic UI and full RTL ship in the MVP, not later.
- Seed community: one tight niche (football fans, developers, or Arabic creators). Invite 50-200 active people personally before opening up.

## MVP scope

| Area | In the MVP |
|---|---|
| Accounts | Email and password signup, email verification, password reset, profile (username, display name, bio, avatar) |
| Posting | Chirp with text, up to 4 images, or 1 video (30 s) |
| Feeds | **Following** (chronological) and **For you** (ranked, stage 1) |
| Social | Follow and unfollow, likes, replies (threads), profile pages |
| Discovery | Basic search (chirps, users) with Arabic normalization, onboarding with topics and suggested accounts |
| Notifications | Likes, replies, follows (in-app) |
| Safety | Report button, admin panel, rate limits |
| Platform | Light and dark themes, English and Arabic UI, responsive web |

## Not in the MVP
Rechirps and quotes, bookmarks (first thing after MVP), direct messages, hashtag trending pages, communities, verification badges, premium, blocking and muting, push notifications, native apps, ads.

## Limits (assumptions marked in `DECISIONS.md`)
- Chirp: 280 graphemes by default, stored per user as `max_chars`. Links count as 23. Media does not count. Premium raises the number later.
- Images: JPEG, PNG, WebP, GIF; 5 MB each; up to 4.
- Video: MP4 or WebM; 30 seconds; 30 MB; one per chirp; not combined with images.
- Bio 160, display name 50, handle 3-20 (`a-z`, `0-9`, `_`).

## Vocabulary
Chirp (noun and verb), reply, like, follow, For you, Following. The action is called the same thing everywhere: button "Chirp", confirmation "Chirped".

## User stories and acceptance criteria

**Sign up.** As a visitor I create an account with email and password.
- Password minimum 8 characters. Verification email is sent. Unverified users can read but not post.
- After verification I pick a unique handle, display name and avatar, then choose topics and see suggested accounts.

**Post.** As a member I write a chirp, optionally with media.
- The counter shows remaining characters using grapheme counting; posting over the limit is blocked with a clear message.
- Direction follows the text as I type. Arabic, English and mixed text all render correctly.
- A video over 30 seconds or a file over the size limit is rejected before upload with a message that says how to fix it.
- On success the chirp appears at the top of my profile and in followers' Following feed, and the button confirms "Chirped".

**Read.** As a member I scroll Following or For you.
- Infinite scroll with cursor pagination, skeletons while loading, an empty state that suggests accounts.
- Each chirp sets its own direction; handles stay left-to-right.

**React.** As a member I like and reply.
- Likes update instantly and roll back with a message if the request fails.
- Replies form a thread under the chirp. Deleting a chirp hides it and keeps the thread structure.

**Follow.** I follow and unfollow from profiles and suggestions. Counts update.

**Search.** I search chirps and people. Searching an Arabic word matches it with or without diacritics and with letter variants (أ/إ/ا, ة/ه, ى/ي).

**Notifications.** I see likes, replies and follows, with an unread count, and can mark all as read.

**Report.** I report a chirp or account with a reason. An admin sees it in a queue, can dismiss it, remove the chirp, or suspend the account, and every action is logged.

## Success signals during the seed phase
Weekly active seed members, chirps per active member, replies per chirp, day-7 return rate, share of Arabic-script chirps, report-to-action time.
