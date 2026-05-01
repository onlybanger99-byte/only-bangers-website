/*
  Only Bangers - Barber-specific availability and pricing

  This migration keeps barber availability per profile/date and adds a
  barber-owned service pricing table so booking amounts come from the
  selected barber instead of a global price list.
*/

begin;

create table if not exists public.barber_availability_slots (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists barber_availability_slots_profile_date_idx
on public.barber_availability_slots(barber_profile_id, available_date);

create index if not exists barber_availability_slots_user_date_idx
on public.barber_availability_slots(user_id, available_date);

create index if not exists barber_availability_slots_active_idx
on public.barber_availability_slots(is_active);

create table if not exists public.barber_service_prices (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.barber_profiles(id) on delete cascade,
  service_id text,
  service_name text not null,
  price numeric not null default 0,
  duration_minutes integer default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_service_prices
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists service_id text,
  add column if not exists service_name text,
  add column if not exists price numeric not null default 0,
  add column if not exists duration_minutes integer default 30,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists barber_service_prices_profile_idx
on public.barber_service_prices(barber_profile_id);

create index if not exists barber_service_prices_active_idx
on public.barber_service_prices(is_active);

alter table public.bookings
  add column if not exists barber_service_price_id uuid references public.barber_service_prices(id),
  add column if not exists amount_due numeric,
  add column if not exists service_name text;

drop trigger if exists trg_barber_service_prices_set_updated_at on public.barber_service_prices;
create trigger trg_barber_service_prices_set_updated_at
before update on public.barber_service_prices
for each row
execute function public.set_updated_at();

alter table public.barber_service_prices enable row level security;

drop policy if exists "barber_service_prices_public_read_active" on public.barber_service_prices;
create policy "barber_service_prices_public_read_active"
on public.barber_service_prices
for select
using (
  is_active = true
  or public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

drop policy if exists "barber_service_prices_insert_self_or_admin" on public.barber_service_prices;
create policy "barber_service_prices_insert_self_or_admin"
on public.barber_service_prices
for insert
with check (
  public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

drop policy if exists "barber_service_prices_update_self_or_admin" on public.barber_service_prices;
create policy "barber_service_prices_update_self_or_admin"
on public.barber_service_prices
for update
using (
  public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
)
with check (
  public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

commit;
