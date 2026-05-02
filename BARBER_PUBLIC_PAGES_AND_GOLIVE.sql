/*
  Only Bangers - Barber public pages, go-live workflow, reviews, and gallery

  Safe additive migration:
  - extends barber_profiles with public profile, map, slug, and go-live fields
  - adds barber_reviews and barber_gallery_images
  - tightens public visibility so only active + live barbers are customer-facing
*/

begin;

alter table public.barber_profiles
  add column if not exists slug text,
  add column if not exists full_name text,
  add column if not exists latitude numeric null,
  add column if not exists longitude numeric null,
  add column if not exists map_url text null,
  add column if not exists is_live boolean not null default false,
  add column if not exists setup_status text not null default 'draft',
  add column if not exists go_live_requested_at timestamptz null,
  add column if not exists go_live_reviewed_at timestamptz null,
  add column if not exists go_live_rejection_reason text null;

create unique index if not exists barber_profiles_slug_unique
on public.barber_profiles (slug)
where slug is not null and length(trim(slug)) > 0;

create index if not exists barber_profiles_active_live_idx
on public.barber_profiles (is_active, is_live);

create index if not exists barber_profiles_setup_status_idx
on public.barber_profiles (setup_status);

create table if not exists public.barber_reviews (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.barber_profiles(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  booking_id uuid null,
  rating integer not null,
  comment text null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.barber_reviews
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists user_id uuid null references auth.users(id) on delete set null,
  add column if not exists booking_id uuid null,
  add column if not exists rating integer,
  add column if not exists comment text null,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

alter table public.barber_reviews
  alter column rating set not null;

create index if not exists barber_reviews_profile_visible_idx
on public.barber_reviews (barber_profile_id, is_visible, created_at desc);

create table if not exists public.barber_gallery_images (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.barber_profiles(id) on delete cascade,
  image_url text not null,
  caption text null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.barber_gallery_images
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists image_url text,
  add column if not exists caption text null,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

alter table public.barber_gallery_images
  alter column image_url set not null;

create index if not exists barber_gallery_images_profile_visible_idx
on public.barber_gallery_images (barber_profile_id, is_visible, sort_order, created_at desc);

update public.barber_profiles
set
  full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(display_name), '')),
  setup_status = case
    when setup_status is null or trim(setup_status) = '' then 'draft'
    else setup_status
  end
where full_name is null
   or setup_status is null
   or trim(setup_status) = '';

update public.barber_profiles
set is_live = false
where is_live is null;

alter table public.barber_reviews enable row level security;
alter table public.barber_gallery_images enable row level security;

drop policy if exists "barber_profiles_public_read" on public.barber_profiles;
drop policy if exists "barber_profiles_select_public_self_or_admin" on public.barber_profiles;
create policy "barber_profiles_select_public_self_or_admin"
on public.barber_profiles
for select
using (
  (is_active = true and is_live = true)
  or auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "barber_profiles_insert_admin_only" on public.barber_profiles;
create policy "barber_profiles_insert_admin_only"
on public.barber_profiles
for insert
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

drop policy if exists "barber_reviews_public_read_visible" on public.barber_reviews;
create policy "barber_reviews_public_read_visible"
on public.barber_reviews
for select
using (
  is_visible = true
  or public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

drop policy if exists "barber_reviews_insert_authenticated" on public.barber_reviews;
create policy "barber_reviews_insert_authenticated"
on public.barber_reviews
for insert
with check (auth.uid() = user_id);

drop policy if exists "barber_reviews_update_owner_or_admin" on public.barber_reviews;
create policy "barber_reviews_update_owner_or_admin"
on public.barber_reviews
for update
using (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
)
with check (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

drop policy if exists "barber_gallery_public_read_visible" on public.barber_gallery_images;
create policy "barber_gallery_public_read_visible"
on public.barber_gallery_images
for select
using (
  is_visible = true
  or public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

drop policy if exists "barber_gallery_insert_owner_or_admin" on public.barber_gallery_images;
create policy "barber_gallery_insert_owner_or_admin"
on public.barber_gallery_images
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

drop policy if exists "barber_gallery_update_owner_or_admin" on public.barber_gallery_images;
create policy "barber_gallery_update_owner_or_admin"
on public.barber_gallery_images
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

drop policy if exists "barber_gallery_delete_owner_or_admin" on public.barber_gallery_images;
create policy "barber_gallery_delete_owner_or_admin"
on public.barber_gallery_images
for delete
using (
  public.has_role(array['admin']::public.user_role[])
  or exists (
    select 1
    from public.barber_profiles bp
    where bp.id = barber_profile_id
      and bp.user_id = auth.uid()
  )
);

commit;
