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
