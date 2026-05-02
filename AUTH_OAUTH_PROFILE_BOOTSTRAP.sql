/*
  Only Bangers - Auth Bootstrap Safety Migration

  Purpose:
  - prevent "Database error creating new user" during OAuth signup
  - ensure every new auth user gets:
    - a default `customer` role
    - a nullable customer profile row
  - align profile RLS with current product rules
*/

begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role'
  ) then
    create type public.user_role as enum ('admin', 'barber', 'customer');
  end if;
end
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  assigned_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text null,
  last_name text null,
  phone_number text null,
  profile_photo_url text null,
  profile_image_url text null,
  avatar_url text null,
  address text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.barber_profiles (
  id uuid unique default gen_random_uuid(),
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text null,
  specialty text null,
  bio text null,
  avatar_url text null,
  profile_image_url text null,
  profile_photo_url text null,
  location text null,
  cutting_location text null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_profiles
  add column if not exists first_name text null,
  add column if not exists last_name text null,
  add column if not exists phone_number text null,
  add column if not exists profile_photo_url text null,
  add column if not exists profile_image_url text null,
  add column if not exists avatar_url text null,
  add column if not exists address text null,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.barber_profiles
  add column if not exists avatar_url text null,
  add column if not exists profile_image_url text null,
  add column if not exists profile_photo_url text null,
  add column if not exists display_name text null,
  add column if not exists bio text null,
  add column if not exists location text null,
  add column if not exists cutting_location text null,
  add column if not exists is_active boolean not null default true;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fallback_name text := nullif(initcap(replace(split_part(coalesce(new.email, ''), '@', 1), '.', ' ')), '');
  full_name text := nullif(trim(coalesce(metadata ->> 'full_name', metadata ->> 'name', fallback_name)), '');
  first_name text := nullif(trim(coalesce(metadata ->> 'first_name', split_part(coalesce(full_name, ''), ' ', 1))), '');
  last_name text := nullif(trim(coalesce(
    metadata ->> 'last_name',
    case
      when full_name is null then ''
      else substr(full_name, length(split_part(full_name, ' ', 1)) + 1)
    end
  )), '');
  avatar text := nullif(trim(coalesce(metadata ->> 'avatar_url', metadata ->> 'picture', metadata ->> 'profile_image_url')), '');
begin
  begin
    insert into public.user_roles (user_id, role)
    values (new.id, 'customer')
    on conflict (user_id) do nothing;

    insert into public.customer_profiles (
      user_id,
      first_name,
      last_name,
      phone_number,
      profile_photo_url,
      profile_image_url,
      avatar_url
    )
    values (
      new.id,
      first_name,
      last_name,
      null,
      avatar,
      avatar,
      avatar
    )
    on conflict (user_id) do nothing;
  exception
    when others then
      raise warning '[handle_new_auth_user] bootstrap failed for auth user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_auth_users_create_customer_role on auth.users;
drop trigger if exists trg_auth_users_bootstrap_profile on auth.users;
create trigger trg_auth_users_bootstrap_profile
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

update public.customer_profiles
set profile_image_url = coalesce(profile_image_url, profile_photo_url, avatar_url)
where profile_image_url is null;

update public.customer_profiles
set avatar_url = coalesce(avatar_url, profile_image_url, profile_photo_url)
where avatar_url is null;

update public.barber_profiles
set profile_image_url = coalesce(profile_image_url, profile_photo_url, avatar_url)
where profile_image_url is null;

update public.barber_profiles
set profile_photo_url = coalesce(profile_photo_url, profile_image_url, avatar_url)
where profile_photo_url is null;

update public.barber_profiles
set avatar_url = coalesce(avatar_url, profile_image_url, profile_photo_url)
where avatar_url is null;

alter table public.user_roles enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.barber_profiles enable row level security;

drop policy if exists "customer_profiles_select_self_admin_or_barber" on public.customer_profiles;
drop policy if exists "customer_profiles_select_self_or_admin" on public.customer_profiles;
create policy "customer_profiles_select_self_or_admin"
on public.customer_profiles
for select
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "customer_profiles_insert_self_or_admin" on public.customer_profiles;
create policy "customer_profiles_insert_self_or_admin"
on public.customer_profiles
for insert
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "customer_profiles_update_self_or_admin" on public.customer_profiles;
create policy "customer_profiles_update_self_or_admin"
on public.customer_profiles
for update
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
)
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_profiles_public_read" on public.barber_profiles;
drop policy if exists "barber_profiles_public_read_active" on public.barber_profiles;
drop policy if exists "barber_profiles_select_public_self_or_admin" on public.barber_profiles;
create policy "barber_profiles_select_public_self_or_admin"
on public.barber_profiles
for select
using (
  is_active = true
  or auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_profiles_insert_admin_only" on public.barber_profiles;
create policy "barber_profiles_insert_admin_only"
on public.barber_profiles
for insert
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "barber_profiles_update_admin_only" on public.barber_profiles;
drop policy if exists "barber_profiles_update_self_or_admin" on public.barber_profiles;
create policy "barber_profiles_update_self_or_admin"
on public.barber_profiles
for update
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
)
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

commit;
