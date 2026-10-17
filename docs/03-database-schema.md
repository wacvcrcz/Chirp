# 03 Database schema

The SQL below is the source of truth. Mirror the tables in Drizzle (`src/lib/db/schema.ts`), but keep triggers, extensions and RLS in hand-written SQL migrations.

## Principles
- All access goes through the API using a server-side connection, so **authorization is enforced in API code**. Row Level Security is still enabled on every table with **no policies**, which blocks direct access through the public anon key.
- IDs are UUIDv7 generated in the app (time-sortable, good for cursor paging). Profiles use the auth user's id.
- Soft delete chirps (`deleted_at`) so reply threads keep their structure.
- Counters (`like_count`, `reply_count`, follower counts) are denormalized and kept correct by triggers.

## Extensions and types

```sql
create extension if not exists citext;
create extension if not exists pg_trgm;

create type user_role     as enum ('user', 'admin');
create type media_kind    as enum ('image', 'video');
create type media_status  as enum ('pending', 'ready', 'rejected');
create type notif_type    as enum ('like', 'reply', 'follow');
create type report_status as enum ('open', 'dismissed', 'actioned');
create type report_target as enum ('chirp', 'user');
```

## Core tables

```sql
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        citext unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name    text check (char_length(display_name) <= 50),
  bio             text check (char_length(bio) <= 160),
  avatar_path     text,
  role            user_role not null default 'user',
  max_chars       int not null default 280,
  preferred_langs text[] not null default '{en}',
  follower_count  int not null default 0,
  following_count int not null default 0,
  suspended_at    timestamptz,
  onboarded_at    timestamptz,
  created_at      timestamptz not null default now()
);

create table chirps (
  id           uuid primary key,                       -- UUIDv7 from the app
  author_id    uuid not null references profiles(id) on delete cascade,
  body         text not null check (char_length(body) <= 2000),
  body_search  text not null default '',               -- normalized copy for search
  lang         text,                                    -- 'ar' | 'en' | 'fr' | 'other'
  reply_to_id  uuid references chirps(id) on delete cascade,
  root_id      uuid references chirps(id) on delete cascade,
  like_count   int not null default 0,
  reply_count  int not null default 0,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table media (
  id           uuid primary key,
  owner_id     uuid not null references profiles(id) on delete cascade,
  chirp_id     uuid references chirps(id) on delete cascade,   -- null until attached
  kind         media_kind not null,
  storage_path text not null,
  mime         text not null,
  size_bytes   int not null,
  width        int,
  height       int,
  duration_ms  int,
  placeholder  text,                                    -- thumbhash or blurhash
  status       media_status not null default 'pending',
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);

create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table likes (
  user_id    uuid not null references profiles(id) on delete cascade,
  chirp_id   uuid not null references chirps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, chirp_id)
);

create table notifications (
  id         uuid primary key,
  user_id    uuid not null references profiles(id) on delete cascade,   -- recipient
  actor_id   uuid not null references profiles(id) on delete cascade,
  type       notif_type not null,
  chirp_id   uuid references chirps(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
```

## Safety and ranking tables

```sql
create table reports (
  id            uuid primary key,
  reporter_id   uuid not null references profiles(id) on delete cascade,
  target_type   report_target not null,
  target_id     uuid not null,
  reason        text not null check (char_length(reason) <= 500),
  status        report_status not null default 'open',
  resolved_by   uuid references profiles(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table moderation_actions (
  id          uuid primary key,
  admin_id    uuid not null references profiles(id),
  action      text not null,            -- 'dismiss' | 'remove_chirp' | 'suspend_user' | 'unsuspend_user'
  target_type report_target not null,
  target_id   uuid not null,
  report_id   uuid references reports(id),
  note        text,
  created_at  timestamptz not null default now()
);

-- What each user actually saw. The ranker cannot learn without this.
create table impressions (
  user_id   uuid not null references profiles(id) on delete cascade,
  chirp_id  uuid not null references chirps(id) on delete cascade,
  surface   text not null,              -- 'for_you' | 'following' | 'profile' | 'search'
  seen_at   timestamptz not null default now(),
  dwell_ms  int
);

-- Onboarding
create table topics (
  slug    text primary key,
  name_en text not null,
  name_ar text not null
);
create table user_topics (
  user_id    uuid not null references profiles(id) on delete cascade,
  topic_slug text not null references topics(slug) on delete cascade,
  primary key (user_id, topic_slug)
);
create table suggested_accounts (
  profile_id uuid not null references profiles(id) on delete cascade,
  topic_slug text not null references topics(slug) on delete cascade,
  rank       int not null default 0,
  primary key (profile_id, topic_slug)
);
```

## Indexes

```sql
create index chirps_author_time  on chirps (author_id, created_at desc, id desc) where deleted_at is null;
create index chirps_time_top     on chirps (created_at desc, id desc) where deleted_at is null and reply_to_id is null;
create index chirps_replies      on chirps (reply_to_id, created_at asc) where deleted_at is null;
create index chirps_search_trgm  on chirps using gin (body_search gin_trgm_ops);
create index profiles_user_trgm  on profiles using gin ((username::text) gin_trgm_ops);
create index profiles_name_trgm  on profiles using gin (display_name gin_trgm_ops);
create index likes_chirp         on likes (chirp_id);
create index follows_followee    on follows (followee_id);
create index notifs_user_time    on notifications (user_id, created_at desc);
create index media_chirp         on media (chirp_id);
create index media_orphans       on media (created_at) where chirp_id is null;
create index reports_open        on reports (created_at) where status = 'open';
create index impressions_user    on impressions (user_id, seen_at desc);
```

## Auth hook: create a profile for every new user

```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```
`username` stays null until onboarding finishes (`onboarded_at` is set then).

## Counter triggers

```sql
create function bump_like_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then update chirps set like_count = like_count + 1 where id = new.chirp_id;
  elsif tg_op = 'DELETE' then update chirps set like_count = greatest(like_count - 1, 0) where id = old.chirp_id;
  end if; return null;
end $$;
create trigger likes_count after insert or delete on likes for each row execute function bump_like_count();

create function bump_reply_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.reply_to_id is not null then
    update chirps set reply_count = reply_count + 1 where id = new.reply_to_id;
  elsif tg_op = 'DELETE' and old.reply_to_id is not null then
    update chirps set reply_count = greatest(reply_count - 1, 0) where id = old.reply_to_id;
  end if; return null;
end $$;
create trigger chirps_reply_count after insert or delete on chirps for each row execute function bump_reply_count();

create function bump_follow_counts() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    update profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
  elsif tg_op = 'DELETE' then
    update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.followee_id;
  end if; return null;
end $$;
create trigger follows_count after insert or delete on follows for each row execute function bump_follow_counts();
```

## Row Level Security

```sql
alter table profiles           enable row level security;
alter table chirps             enable row level security;
alter table media              enable row level security;
alter table follows            enable row level security;
alter table likes              enable row level security;
alter table notifications      enable row level security;
alter table reports            enable row level security;
alter table moderation_actions enable row level security;
alter table impressions        enable row level security;
alter table topics             enable row level security;
alter table user_topics        enable row level security;
alter table suggested_accounts enable row level security;
-- No policies: the anon key can read and write nothing. The server connection bypasses RLS.
```

## Drizzle sketch

```ts
// src/lib/db/schema.ts
import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const chirps = pgTable('chirps', {
  id: uuid('id').primaryKey(),
  authorId: uuid('author_id').notNull(),
  body: text('body').notNull(),
  bodySearch: text('body_search').notNull().default(''),
  lang: text('lang'),
  replyToId: uuid('reply_to_id'),
  rootId: uuid('root_id'),
  likeCount: integer('like_count').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [index('chirps_author_time').on(t.authorId, t.createdAt, t.id)]);
```
Use raw SQL (`db.execute(sql\`...\`)`) for feed and search queries; see `06`.

## Maintenance
- `impressions`: delete rows older than 30 days (Vercel Cron). Consider partitioning by month if volume grows.
- `media` with `chirp_id is null` older than 24 hours: delete the storage object and the row (see `07`).

## After the MVP: bookmarks

```sql
create table bookmarks (
  user_id    uuid not null references profiles(id) on delete cascade,
  chirp_id   uuid not null references chirps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, chirp_id)
);
create index bookmarks_user_time on bookmarks (user_id, created_at desc);
alter table bookmarks enable row level security;
```
