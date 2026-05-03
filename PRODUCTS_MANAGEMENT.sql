/*
  Only Bangers - Product management

  Safe additive migration for admin product CRUD and public active product listing.
*/

begin;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text null,
  price numeric not null default 0,
  image_url text null,
  category text null,
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists description text null,
  add column if not exists price numeric not null default 0,
  add column if not exists image_url text null,
  add column if not exists category text null,
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_slug_unique
on public.products (slug);

create index if not exists products_active_idx
on public.products (is_active, created_at desc);

alter table public.products enable row level security;

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active"
on public.products
for select
using (
  is_active = true
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "products_admin_insert_only" on public.products;
create policy "products_admin_insert_only"
on public.products
for insert
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "products_admin_update_only" on public.products;
create policy "products_admin_update_only"
on public.products
for update
using (public.has_role(array['admin']::public.user_role[]))
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "products_admin_delete_only" on public.products;
create policy "products_admin_delete_only"
on public.products
for delete
using (public.has_role(array['admin']::public.user_role[]));

commit;
