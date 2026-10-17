-- RLS everywhere, no policies: the anon and publishable keys can read and
-- write nothing. The server connection (table owner) bypasses RLS and the API
-- enforces authorization in code.
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
