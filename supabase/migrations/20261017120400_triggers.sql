-- Auth hook: create a profile for every new user.
-- username stays null until onboarding finishes (onboarded_at is set then).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Counter triggers: denormalized counts stay correct on insert and delete.
create function bump_like_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update chirps set like_count = like_count + 1 where id = new.chirp_id;
  elsif tg_op = 'DELETE' then
    update chirps set like_count = greatest(like_count - 1, 0) where id = old.chirp_id;
  end if;
  return null;
end $$;
create trigger likes_count after insert or delete on likes for each row execute function bump_like_count();

create function bump_reply_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.reply_to_id is not null then
    update chirps set reply_count = reply_count + 1 where id = new.reply_to_id;
  elsif tg_op = 'DELETE' and old.reply_to_id is not null then
    update chirps set reply_count = greatest(reply_count - 1, 0) where id = old.reply_to_id;
  end if;
  return null;
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
  end if;
  return null;
end $$;
create trigger follows_count after insert or delete on follows for each row execute function bump_follow_counts();
