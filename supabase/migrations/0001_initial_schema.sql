-- Linger initial schema
-- Run this once in your Supabase SQL editor (or via supabase CLI).

create extension if not exists "uuid-ossp";

-- Profiles: app-specific user data, extends auth.users
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  default_cooldown_days_online integer not null default 7
    check (default_cooldown_days_online between 1 and 90),
  default_cooldown_days_inperson integer not null default 3
    check (default_cooldown_days_inperson between 1 and 90),
  bored_checkin_enabled boolean not null default true,
  email_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Items: the core entity
create table public.items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,

  -- Source data
  source_type text not null check (source_type in ('url', 'photo')),
  source_url text,
  store_name text,
  category text not null check (category in ('clothes', 'beauty', 'electronics', 'home', 'other')),

  -- Content
  name text not null,
  image_url text,
  reason text,

  -- Pricing
  price_added numeric(10, 2) not null check (price_added >= 0),
  price_current numeric(10, 2),
  price_currency text not null default 'USD',
  is_in_stock boolean,
  last_price_check_at timestamptz,

  -- Cooldown
  cooldown_started_at timestamptz not null default now(),
  cooldown_ends_at timestamptz not null,
  cooldown_extended_count integer not null default 0,

  -- State
  status text not null default 'active'
    check (status in ('active', 'pending_decision', 'archived', 'bought', 'deleted')),
  decided_at timestamptz,
  override_used boolean not null default false,

  -- Bookkeeping
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_items_user_status on public.items(user_id, status);
create index idx_items_cooldown_ends on public.items(cooldown_ends_at) where status = 'active';

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_items_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Price history: append-only log
create table public.price_history (
  id bigserial primary key,
  item_id uuid not null references public.items on delete cascade,
  price numeric(10, 2) not null,
  is_in_stock boolean,
  checked_at timestamptz not null default now()
);

create index idx_price_history_item on public.price_history(item_id, checked_at desc);

-- Notifications log
create table public.notifications_sent (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid references public.items on delete cascade,
  kind text not null check (kind in (
    'cooldown_ended',
    'price_drop',
    'low_stock',
    'milestone'
  )),
  sent_at timestamptz not null default now()
);

create index idx_notifications_user_kind on public.notifications_sent(user_id, kind);
create unique index uniq_cooldown_ended_per_item on public.notifications_sent(item_id, kind)
  where kind = 'cooldown_ended';

-- Daily check-ins ("bored or shopping?")
create table public.checkins (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  answer text not null check (answer in ('bored', 'shopping', 'dismissed')),
  created_at timestamptz not null default now()
);

create index idx_checkins_user_date on public.checkins(user_id, created_at desc);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.price_history enable row level security;
alter table public.notifications_sent enable row level security;
alter table public.checkins enable row level security;

create policy "Users own their profile"
  on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users own their items"
  on public.items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their price history"
  on public.price_history for all
  using (auth.uid() = (select user_id from public.items where id = item_id));

create policy "Users own their notifications"
  on public.notifications_sent for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their checkins"
  on public.checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for photo uploads (run separately in Supabase Storage UI or via SQL):
-- insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', false);
--
-- Storage RLS:
-- create policy "Users can upload to their own folder"
--   on storage.objects for insert
--   with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "Users can read their own photos"
--   on storage.objects for select
--   using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "Users can delete their own photos"
--   on storage.objects for delete
--   using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
