-- Site content management for admin-controlled brand, media, and social assets.
-- If automatic storage bucket creation is not available in your environment,
-- create a public Supabase Storage bucket named `site-assets`.

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  type text not null check (
    type in (
      'image',
      'video',
      'text',
      'url',
      'social_link',
      'service_media',
      'logo',
      'background'
    )
  ),
  value text,
  image_url text,
  video_url text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_content (key, label, type, value, image_url, metadata)
values
  ('site_logo', 'Site Logo', 'logo', null, null, '{"group":"brand","accepts":"image"}'::jsonb),
  ('site_background_image', 'Site Background Image', 'background', '/images/header-bg.png', '/images/header-bg.png', '{"group":"backgrounds","accepts":"image"}'::jsonb),
  ('home_hero_image', 'Home Hero Image', 'image', '/images/feature-fade.jpg', '/images/feature-fade.jpg', '{"group":"home-page","accepts":"image"}'::jsonb),
  ('home_hero_video', 'Home Hero Video', 'video', null, null, '{"group":"home-page","accepts":"video"}'::jsonb),
  ('services_background_image', 'Services Background Image', 'background', '/images/header-bg.png', '/images/header-bg.png', '{"group":"backgrounds","accepts":"image"}'::jsonb),
  ('barber_dashboard_background', 'Barber Dashboard Background', 'background', null, null, '{"group":"backgrounds","accepts":"image"}'::jsonb),
  ('login_background_image', 'Login Background Image', 'background', '/images/header-bg.png', '/images/header-bg.png', '{"group":"backgrounds","accepts":"image"}'::jsonb),
  ('footer_instagram_url', 'Footer Instagram URL', 'social_link', 'https://www.instagram.com/only_bangers99/', null, '{"group":"social-links"}'::jsonb),
  ('footer_facebook_url', 'Footer Facebook URL', 'social_link', 'https://www.facebook.com/61582809069248/?modal=focused_switcher_dialog', null, '{"group":"social-links"}'::jsonb),
  ('footer_tiktok_url', 'Footer TikTok URL', 'social_link', 'https://www.tiktok.com/@onlybanger.co.za?is_from_webapp=1&sender_device=pc', null, '{"group":"social-links"}'::jsonb),
  ('footer_whatsapp_url', 'Footer WhatsApp URL', 'social_link', 'https://wa.me/27699864730', null, '{"group":"social-links"}'::jsonb),
  ('business_phone', 'Business Phone', 'text', '+27 661591976', null, '{"group":"contact-details"}'::jsonb),
  ('business_email', 'Business Email', 'text', 'support@onlybangers.co.za', null, '{"group":"contact-details"}'::jsonb)
on conflict (key) do nothing;
