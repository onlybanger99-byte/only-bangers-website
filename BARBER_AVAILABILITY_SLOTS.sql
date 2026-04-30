/*
  Only Bangers - Flexible Barber Availability Slots

  This migration removes the need for global business-hour enforcement by
  introducing barber-owned date/time slots for both approved barbers and
  pending barber applications.

  Run after:
  - SUPABASE_RBAC_SETUP.sql
  - PROFILES_AND_BOOKING_CONSTRAINTS.sql
  - BARBER_APPLICATIONS_WORKFLOW.sql
*/

begin;

create table if not exists public.barber_availability_slots (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid references public.barber_profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.barber_application_availability_slots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.barber_applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.barber_availability_slots is
  'Flexible availability slots owned by approved barbers and used by live booking availability.';

comment on table public.barber_application_availability_slots is
  'Availability slots submitted during barber application and copied into live barber availability after approval.';

create index if not exists idx_barber_availability_slots_profile_id
  on public.barber_availability_slots (barber_profile_id);

create index if not exists idx_barber_availability_slots_user_id
  on public.barber_availability_slots (user_id);

create index if not exists idx_barber_availability_slots_available_date
  on public.barber_availability_slots (available_date);

create index if not exists idx_barber_availability_slots_is_active
  on public.barber_availability_slots (is_active);

create index if not exists idx_barber_application_slots_application_id
  on public.barber_application_availability_slots (application_id);

create index if not exists idx_barber_application_slots_user_id
  on public.barber_application_availability_slots (user_id);

create index if not exists idx_barber_application_slots_available_date
  on public.barber_application_availability_slots (available_date);

alter table public.barber_availability_slots enable row level security;
alter table public.barber_application_availability_slots enable row level security;

drop trigger if exists trg_barber_availability_slots_set_updated_at on public.barber_availability_slots;
create trigger trg_barber_availability_slots_set_updated_at
before update on public.barber_availability_slots
for each row
execute function public.set_updated_at();

drop trigger if exists trg_barber_application_slots_set_updated_at on public.barber_application_availability_slots;
create trigger trg_barber_application_slots_set_updated_at
before update on public.barber_application_availability_slots
for each row
execute function public.set_updated_at();

drop policy if exists "barber_availability_slots_select_self_admin_public_active" on public.barber_availability_slots;
create policy "barber_availability_slots_select_self_admin_public_active"
on public.barber_availability_slots
for select
using (
  is_active = true
  or auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_availability_slots_insert_self_or_admin" on public.barber_availability_slots;
create policy "barber_availability_slots_insert_self_or_admin"
on public.barber_availability_slots
for insert
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_availability_slots_update_self_or_admin" on public.barber_availability_slots;
create policy "barber_availability_slots_update_self_or_admin"
on public.barber_availability_slots
for update
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
)
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_application_slots_select_self_or_admin" on public.barber_application_availability_slots;
create policy "barber_application_slots_select_self_or_admin"
on public.barber_application_availability_slots
for select
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_application_slots_insert_self_or_admin" on public.barber_application_availability_slots;
create policy "barber_application_slots_insert_self_or_admin"
on public.barber_application_availability_slots
for insert
with check (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_application_slots_update_self_or_admin" on public.barber_application_availability_slots;
create policy "barber_application_slots_update_self_or_admin"
on public.barber_application_availability_slots
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
