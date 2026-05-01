/*
  Only Bangers - Barber-specific availability and pricing

  This migration keeps barber availability per profile/date and adds a
  barber-owned service pricing table so booking amounts come from the
  selected barber instead of a global price list.
*/

begin;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  is_active boolean not null default true,
  sort_order integer
);

alter table public.services
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer;

insert into public.services (name, slug, description, is_active, sort_order)
values
  ('Classic Fade', 'classic-fade', 'A clean, balanced fade finished with sharp detail work and a polished silhouette.', true, 1),
  ('Fade with Dye', 'fade-with-dye', 'Precision fade service with colour enhancement for a bold, finished look.', true, 2),
  ('Brush with Trim', 'brush-with-trim', 'Shape and refresh your style with a neat trim and brush-focused finish.', true, 3),
  ('Beard Trim', 'beard-trim', 'Line up, shape, and refine your beard for a sharp, well-kept profile.', true, 4),
  ('Clean Shave', 'clean-shave', 'Close, smooth shave service with careful finishing and clean edges.', true, 5),
  ('Hair & Beard Combo', 'hair-beard-combo', 'Full grooming session that pairs a haircut with detailed beard work.', true, 6)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

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
  service_id uuid,
  service_name text not null,
  price numeric not null default 0,
  duration_minutes integer default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_profiles
  add column if not exists location text,
  add column if not exists avatar_url text,
  add column if not exists profile_image_url text;

alter table public.barber_service_prices
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists service_id uuid,
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

create index if not exists barber_service_prices_service_idx
on public.barber_service_prices(service_id);

create unique index if not exists barber_service_prices_active_profile_service_unique
on public.barber_service_prices(barber_profile_id, service_id)
where is_active = true and service_id is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'barber_service_prices'
      and column_name = 'service_id'
      and udt_name = 'uuid'
  ) then
    alter table public.barber_service_prices
      drop constraint if exists barber_service_prices_service_id_fkey;

    alter table public.barber_service_prices
      add constraint barber_service_prices_service_id_fkey
      foreign key (service_id) references public.services(id) on delete set null;
  end if;
end $$;

update public.barber_service_prices bsp
set
  service_id = s.id,
  service_name = s.name
from public.services s
where bsp.service_id is null
  and lower(trim(bsp.service_name)) = lower(trim(s.name));

update public.barber_service_prices
set is_active = false
where service_id is null;

alter table public.bookings
  add column if not exists barber_service_price_id uuid references public.barber_service_prices(id),
  add column if not exists amount_due numeric,
  add column if not exists service_name text,
  add column if not exists barber_name text,
  add column if not exists starts_at timestamptz,
  add column if not exists status text,
  add column if not exists payment_status text;

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
