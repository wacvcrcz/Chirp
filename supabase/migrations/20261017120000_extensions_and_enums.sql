-- Extensions and enum types. Postgres has no "create type if not exists", so
-- the migration ledger keeps this run-once.
create extension if not exists citext;
create extension if not exists pg_trgm;

create type user_role     as enum ('user', 'admin');
create type media_kind    as enum ('image', 'video');
create type media_status  as enum ('pending', 'ready', 'rejected');
create type notif_type    as enum ('like', 'reply', 'follow');
create type report_status as enum ('open', 'dismissed', 'actioned');
create type report_target as enum ('chirp', 'user');
