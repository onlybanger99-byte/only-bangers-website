/*
  Only Bangers - Customer Profiles, Barber Profiles, and Booking Slot Enforcement

  Run after:
  - SUPABASE_RBAC_SETUP.sql
  - BOOKINGS_SCHEMA.sql
*/

begin;

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_users_create_customer_role on auth.users;
create trigger trg_auth_users_create_customer_role
after insert on auth.users
for each row
execute function public.handle_new_user_role();

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone_number text,
  profile_photo_url text,
  address text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.barber_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  specialty text,
  profile_photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_barber_profiles_active on public.barber_profiles (is_active);

alter table public.customer_profiles enable row level security;
alter table public.barber_profiles enable row level security;

drop trigger if exists trg_customer_profiles_set_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_set_updated_at
before update on public.customer_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_barber_profiles_set_updated_at on public.barber_profiles;
create trigger trg_barber_profiles_set_updated_at
before update on public.barber_profiles
for each row
execute function public.set_updated_at();

drop policy if exists "customer_profiles_select_self_admin_or_barber" on public.customer_profiles;
create policy "customer_profiles_select_self_admin_or_barber"
on public.customer_profiles
for select
using (
  auth.uid() = user_id
  or public.has_role(array['admin', 'barber']::public.user_role[])
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
create policy "barber_profiles_public_read"
on public.barber_profiles
for select
using (is_active = true);

drop policy if exists "barber_profiles_insert_admin_only" on public.barber_profiles;
create policy "barber_profiles_insert_admin_only"
on public.barber_profiles
for insert
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "barber_profiles_update_admin_only" on public.barber_profiles;
create policy "barber_profiles_update_admin_only"
on public.barber_profiles
for update
using (public.has_role(array['admin']::public.user_role[]))
with check (public.has_role(array['admin']::public.user_role[]));

alter table public.bookings
  add column if not exists barber_name text,
  add column if not exists service_id text;

create unique index if not exists bookings_barber_slot_unique
on public.bookings (barber_id, starts_at)
where barber_id is not null and status <> 'cancelled';

create or replace function public.get_booked_barber_slots(
  p_barber_id uuid,
  p_day date
)
returns table (starts_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.starts_at
  from public.bookings b
  where b.barber_id = p_barber_id
    and b.status <> 'cancelled'
    and b.starts_at >= (p_day::timestamptz)
    and b.starts_at < ((p_day + 1)::timestamptz)
  order by b.starts_at asc;
$$;

grant execute on function public.get_booked_barber_slots(uuid, date) to anon;
grant execute on function public.get_booked_barber_slots(uuid, date) to authenticated;

drop policy if exists "bookings_insert_by_role_scope" on public.bookings;
create policy "bookings_insert_by_role_scope"
on public.bookings
for insert
with check (
  public.has_role(array['admin']::public.user_role[])
  or (public.current_user_role() = 'customer' and auth.uid() = user_id)
);

commit;
