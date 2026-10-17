---
name: chirp-media-uploads
description: Chirp image and video upload flow, limits and display. Use when working on media upload, signed URLs, Supabase Storage, the media grid, the video player, avatars or the media cleanup job.
---

# Chirp media uploads

## Limits
Images: JPEG, PNG, WebP, GIF; 5 MB each; up to 4 per chirp. Video: MP4 or WebM; 30 seconds; 30 MB; one per chirp; not mixed with images. Avatars: 2 MB.

## Flow (never upload through an API route)
1. Client validates type, size and duration, and compresses images.
2. `POST /api/v1/media/upload-url` validates and rate limits, inserts a `media` row (`pending`), returns `{ mediaId, path, token }`.
3. Client uploads straight to Supabase Storage with the signed token.
4. `POST /api/v1/chirps` with `mediaIds`; the server confirms each object exists with the expected size, then marks it `ready` and attaches it.
5. A daily cron deletes media with no chirp older than 24 hours (storage object and row).

## Rules
- Store storage **paths**, never full URLs; build URLs with `mediaUrl(path)`.
- Path format: `{userId}/{mediaId}.{ext}`.
- Duration is checked in the browser and the server checks the declared values; add a real probe only if abuse appears.
- No server-side transcoding at launch.
- User messages: "This video is {seconds} seconds. Trim it to 30 seconds or less." and "This image is {size} MB. The limit is 5 MB."
- Display: reserved aspect ratios, ThumbHash or BlurHash placeholder, lazy loading. Video: `playsinline`, muted autoplay at 60% visible, one at a time, unmute control, poster.

Check the current Supabase storage docs for exact method names before wiring signed uploads.

Details: `docs/07-media-pipeline.md`.
