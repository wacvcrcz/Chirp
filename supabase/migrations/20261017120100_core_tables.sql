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
  lang         text,                                   -- 'ar' | 'en' | 'fr' | 'other'
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
