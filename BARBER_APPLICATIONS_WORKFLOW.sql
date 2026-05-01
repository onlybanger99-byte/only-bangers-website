/*
  Only Bangers - Barber Application and Approval Workflow

  This migration safely adds the application workflow needed for customers
  to apply to become barbers without changing roles until admin approval.

  Run after:
  - SUPABASE_RBAC_SETUP.sql
  - PROFILES_AND_BOOKING_CONSTRAINTS.sql
*/

begin;

create table if not exists public.barber_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  display_name text,
  phone text,
  cutting_location text not null,
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  portfolio_url text,
  bio text,
  available_days text[] not null default '{}',
  available_start_time time,
  available_end_time time,
  notes text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.barber_applications is
  'Customer-submitted barber applications that require admin approval before role promotion.';

alter table public.barber_applications
  add column if not exists display_name text,
  add column if not exists phone text,
  add column if not exists cutting_location text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists facebook_url text,
  add column if not exists portfolio_url text,
  add column if not exists bio text,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists available_start_time time,
  add column if not exists available_end_time time,
  add column if not exists notes text,
  add column if not exists reviewed_by uuid references auth.users (id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.barber_applications
  drop constraint if exists barber_applications_status_check;

alter table public.barber_applications
  add constraint barber_applications_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists idx_barber_applications_user_created_at
  on public.barber_applications (user_id, created_at desc);

create index if not exists idx_barber_applications_status_created_at
  on public.barber_applications (status, created_at desc);

create unique index if not exists barber_applications_one_pending_per_user
  on public.barber_applications (user_id)
  where status = 'pending';

create table if not exists public.barber_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  specialty text,
  phone text,
  bio text,
  avatar_url text,
  profile_image_url text,
  profile_photo_url text,
  cutting_location text,
  location text,
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  portfolio_url text,
  available_days text[] not null default '{}',
  available_start_time time,
  available_end_time time,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.barber_profiles
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists display_name text,
  add column if not exists specialty text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists profile_image_url text,
  add column if not exists profile_photo_url text,
  add column if not exists cutting_location text,
  add column if not exists location text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists facebook_url text,
  add column if not exists portfolio_url text,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists available_start_time time,
  add column if not exists available_end_time time,
  add column if not exists is_active boolean not null default false,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.barber_profiles is
  'Approved barber profiles used by booking selection, the public barber page, and admin operations.';

comment on column public.barber_profiles.cutting_location is
  'Primary cutting area or address shown for approved active barbers.';

comment on column public.barber_profiles.location is
  'Compatibility location column for older queries and admin approval payloads.';

comment on column public.barber_profiles.available_days is
  'Days of the week the barber is available for appointments.';

create unique index if not exists idx_barber_profiles_user_id_unique
  on public.barber_profiles (user_id);

create index if not exists idx_barber_profiles_is_active
  on public.barber_profiles (is_active);

alter table public.barber_applications enable row level security;
alter table public.barber_profiles enable row level security;

drop trigger if exists trg_barber_applications_set_updated_at on public.barber_applications;
create trigger trg_barber_applications_set_updated_at
before update on public.barber_applications
for each row
execute function public.set_updated_at();

drop trigger if exists trg_barber_profiles_set_updated_at on public.barber_profiles;
create trigger trg_barber_profiles_set_updated_at
before update on public.barber_profiles
for each row
execute function public.set_updated_at();

drop policy if exists "barber_applications_select_own_or_admin" on public.barber_applications;
create policy "barber_applications_select_own_or_admin"
on public.barber_applications
for select
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_applications_insert_self" on public.barber_applications;
create policy "barber_applications_insert_self"
on public.barber_applications
for insert
with check (
  auth.uid() = user_id
  and public.current_user_role() = 'customer'
);

drop policy if exists "barber_applications_update_admin_only" on public.barber_applications;
create policy "barber_applications_update_admin_only"
on public.barber_applications
for update
using (public.has_role(array['admin']::public.user_role[]))
with check (public.has_role(array['admin']::public.user_role[]));

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

drop policy if exists "barber_profiles_insert_admin_only" on public.barber_profiles;
create policy "barber_profiles_insert_admin_only"
on public.barber_profiles
for insert
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "barber_profiles_public_read_active" on public.barber_profiles;
create policy "barber_profiles_public_read_active"
on public.barber_profiles
for select
using (
  is_active = true
  or auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

commit;
