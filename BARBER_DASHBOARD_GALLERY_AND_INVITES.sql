/*
  Only Bangers - Barber dashboard polish, gallery storage metadata, and profile safety

  Safe additive migration:
  - extends barber_profiles with map/profile/public fields needed by the barber dashboard
  - extends barber_gallery_images with storage_path and updated_at
  - ensures barber availability and service pricing tables still exist with required columns

  Supabase Storage note:
  - Create a bucket named `barber-gallery`
  - Recommended: public bucket, because the app stores and serves public image URLs
  - Upload path format used by the app:
      barber-gallery/{barber_profile_id}/{timestamp}-{safe-file-name}
*/

begin;

alter table public.barber_profiles
  add column if not exists slug text,
  add column if not exists display_name text,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists cutting_location text,
  add column if not exists latitude numeric null,
  add column if not exists longitude numeric null,
  add column if not exists map_url text null,
  add column if not exists go_live_rejection_reason text null,
  add column if not exists go_live_requested_at timestamptz null,
  add column if not exists go_live_reviewed_at timestamptz null,
  add column if not exists go_live_reviewed_by uuid references auth.users(id),
  add column if not exists portfolio_url text null,
  add column if not exists instagram_url text null,
  add column if not exists tiktok_url text null,
  add column if not exists facebook_url text null,
  add column if not exists avatar_url text null,
  add column if not exists profile_image_url text null,
  add column if not exists profile_photo_url text null,
  add column if not exists cover_image_url text null,
  add column if not exists is_active boolean not null default false,
  add column if not exists is_live boolean not null default false,
  add column if not exists setup_status text not null default 'draft',
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists barber_profiles_slug_unique_idx
on public.barber_profiles (slug)
where slug is not null and length(trim(slug)) > 0;

create table if not exists public.barber_gallery_images (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  image_url text not null,
  storage_path text null,
  caption text null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_gallery_images
  add column if not exists storage_path text null,
  add column if not exists caption text null,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists barber_gallery_images_storage_path_idx
on public.barber_gallery_images (storage_path);

drop trigger if exists trg_barber_gallery_images_set_updated_at on public.barber_gallery_images;
create trigger trg_barber_gallery_images_set_updated_at
before update on public.barber_gallery_images
for each row
execute function public.set_updated_at();

create table if not exists public.barber_availability_slots (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_availability_slots
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists available_date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.barber_service_prices (
  id uuid primary key default gen_random_uuid(),
  barber_profile_id uuid not null references public.barber_profiles(id) on delete cascade,
  service_id uuid,
  service_name text not null,
  price numeric not null default 0,
  duration_minutes integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_service_prices
  add column if not exists barber_profile_id uuid references public.barber_profiles(id) on delete cascade,
  add column if not exists service_id uuid,
  add column if not exists service_name text,
  add column if not exists price numeric not null default 0,
  add column if not exists duration_minutes integer not null default 30,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists barber_service_prices_profile_service_unique_idx
on public.barber_service_prices (barber_profile_id, service_id)
where service_id is not null;

commit;
