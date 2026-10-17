-- Runs after `supabase db reset` replays migrations. Kept small so reset stays
-- fast; the full demo community (50 profiles, 400 chirps) is `pnpm db:seed`,
-- which needs the auth trigger and the server connection.
insert into topics (slug, name_en, name_ar) values
  ('football', 'Football', 'كرة القدم'),
  ('dev',      'Development', 'البرمجة'),
  ('design',   'Design', 'التصميم'),
  ('books',    'Books', 'الكتب'),
  ('food',     'Food', 'الطبخ'),
  ('music',    'Music', 'الموسيقى'),
  ('travel',   'Travel', 'السفر'),
  ('darija',   'Darija', 'الداريجة')
on conflict (slug) do nothing;
