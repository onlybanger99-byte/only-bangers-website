create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  type text not null,
  value text,
  image_url text,
  video_url text,
  storage_path text,
  metadata jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.services
add column if not exists image_url text,
add column if not exists background_image_url text,
add column if not exists media_storage_path text,
add column if not exists updated_at timestamptz default now();

alter table public.barber_profiles
add column if not exists avatar_url text,
add column if not exists profile_image_url text,
add column if not exists profile_photo_url text,
add column if not exists updated_at timestamptz default now();

insert into public.site_content (key, label, type, metadata, is_active)
values
  ('global_page_background', 'Global Page Background', 'background', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('site_banner_image', 'Site Banner Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_1_image', 'Homepage Section 1 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_2_image', 'Homepage Section 2 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_3_image', 'Homepage Section 3 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_4_image', 'Homepage Section 4 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_5_image', 'Homepage Section 5 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_6_image', 'Homepage Section 6 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('home_section_7_image', 'Homepage Section 7 Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('about_founder_image', 'About Founder Image', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('default_barber_avatar', 'Default Barber Avatar', 'image', '{"group":"site-images","accepts":"image"}'::jsonb, true),
  ('login_background_image', 'Login Background Image', 'background', '{"group":"backgrounds","accepts":"image"}'::jsonb, true),
  ('services_background_image', 'Services Background Image', 'background', '{"group":"backgrounds","accepts":"image"}'::jsonb, true),
  ('barber_dashboard_background', 'Barber Dashboard Background', 'background', '{"group":"backgrounds","accepts":"image"}'::jsonb, true),
  ('admin_dashboard_background', 'Admin Dashboard Background', 'background', '{"group":"backgrounds","accepts":"image"}'::jsonb, true)
on conflict (key) do nothing;

-- Create a public Supabase Storage bucket named "site-assets" if automatic bucket creation is blocked.
