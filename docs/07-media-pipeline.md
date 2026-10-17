# 07 Media pipeline

Goal: images and 30-second videos in the MVP, with no media passing through serverless API routes and no server-side transcoding at launch.

## Limits

| Type | Allowed | Limit |
|---|---|---|
| Image | JPEG, PNG, WebP, GIF | 5 MB each, up to 4 per chirp |
| Video | MP4, WebM | 30 seconds, 30 MB, one per chirp |
| Mixing | Images or one video, not both | |
| Avatar | JPEG, PNG, WebP | 2 MB, cropped square client-side |

Check your Supabase plan's per-file and bandwidth limits before launch; they depend on the plan.

## Flow

```
1. Client validates type, size, duration (video) and compresses images
2. Client  → POST /api/v1/media/upload-url { kind, mime, sizeBytes, width, height, durationMs }
3. Server  validates + rate limits, inserts media row (status 'pending'), returns { mediaId, path, token }
4. Client  uploads directly to Supabase Storage with the signed token
5. Client  → POST /api/v1/chirps { body, mediaIds }
6. Server  confirms each object exists with the expected size, sets media.status = 'ready' and chirp_id
7. Cron    deletes media with chirp_id null older than 24 hours (storage object and row)
```

## Storage layout
Bucket `media`, public read. Path: `{userId}/{mediaId}.{ext}`. Avatars: `avatars/{userId}/{mediaId}.{ext}` in a second public bucket. Only store paths in the database; build URLs with a helper:

```ts
// src/lib/media-url.ts
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export const mediaUrl = (path: string) => sb.storage.from('media').getPublicUrl(path).data.publicUrl;
```
Moving to another host later (for example Cloudflare R2) then means changing one function.

## Server: signed upload URL

```ts
// src/app/api/v1/media/upload-url/route.ts (core)
import { createClient } from '@supabase/supabase-js';
import { newId } from '@/lib/ids';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

// after auth, rate limit and zod validation:
if (!EXT[input.mime]) throw new ApiError(422, 'validation', 'This file type is not supported.');
if (input.kind === 'video' && (input.durationMs > 30_000 || input.sizeBytes > 30 * 1024 * 1024))
  throw new ApiError(422, 'validation', 'Videos can be up to 30 seconds and 30 MB. Trim or compress yours.');
if (input.kind === 'image' && input.sizeBytes > 5 * 1024 * 1024)
  throw new ApiError(422, 'validation', 'Images can be up to 5 MB.');

const mediaId = newId();
const path = `${user.id}/${mediaId}.${EXT[input.mime]}`;
const { data, error } = await admin.storage.from('media').createSignedUploadUrl(path);
if (error) throw new ApiError(500, 'server', 'Could not start the upload. Try again.');
await insertMedia({ id: mediaId, ownerId: user.id, kind: input.kind, mime: input.mime, sizeBytes: input.sizeBytes,
  width: input.width, height: input.height, durationMs: input.durationMs, storagePath: path });
return NextResponse.json({ mediaId, path, token: data.token });
```
Check the current supabase-js storage docs for the exact method signatures before wiring this up.

## Client: validate, compress, upload

```ts
// src/lib/media/client.ts
import imageCompression from 'browser-image-compression';

export async function prepareImage(file: File) {
  const compressed = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2048, useWebWorker: true });
  const { width, height } = await imageSize(compressed);
  return { file: compressed, width, height };
}

export function videoDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(Math.round(v.duration * 1000)); };
    v.onerror = () => reject(new Error('Could not read this video.'));
    v.src = URL.createObjectURL(file);
  });
}

export async function uploadToSupabase(path: string, token: string, file: File) {
  const { error } = await supabase.storage.from('media').uploadToSignedUrl(path, token, file);
  if (error) throw error;
}
```
The duration check runs in the browser and can be bypassed, so the server also checks the declared duration and size, and the confirm step checks the stored object's size. Add a worker that probes the real duration only if abuse appears.

User-facing messages: "This video is {seconds} seconds. Trim it to 30 seconds or less." and "This image is {size} MB. The limit is 5 MB."

## Display
- **Images:** `next/image` or `<img>` with reserved `aspect-ratio` from stored width and height; blurred placeholder from `placeholder` (ThumbHash or BlurHash) while loading. Lazy-load below the fold.
- **Video:** `<video playsinline muted loop preload="metadata" poster=...>`. Start playing when 60% visible, pause when not. Tap to unmute. Only one video plays at a time.
- **Grid:** 1 image full width; 2 side by side; 3 as one large plus two small; 4 as 2x2. Keep the grid mirrored in RTL (use logical classes and `grid` ordering, not manual left/right).

## Cleanup cron

```ts
// src/app/api/cron/media-cleanup/route.ts
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });
  const orphans = await findOrphanMedia({ olderThanHours: 24, limit: 200 });
  if (orphans.length) {
    await admin.storage.from('media').remove(orphans.map(m => m.storagePath));
    await deleteMediaRows(orphans.map(m => m.id));
  }
  return Response.json({ removed: orphans.length });
}
```
```json
// vercel.json
{ "crons": [
  { "path": "/api/cron/media-cleanup", "schedule": "0 3 * * *" },
  { "path": "/api/cron/impressions-retention", "schedule": "30 3 * * *" }
] }
```

## When chirps are removed
On soft delete or moderation removal, keep the files for a short retention window for review, then remove them with the same cleanup job (add a `deleted_at` check). On account deletion, remove all of the user's media.

## Later options
- A small worker (any host that can run FFmpeg) that transcodes to MP4 at one or two sizes and extracts a poster, triggered by QStash.
- A managed video service if you would rather not run the pipeline.
- Cloudflare R2 plus a CDN if bandwidth costs grow.
