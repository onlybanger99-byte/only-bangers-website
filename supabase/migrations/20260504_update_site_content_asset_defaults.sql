-- Adds the newer site asset keys used by the cleaned admin settings experience.
-- Existing data is preserved and rows are only created when missing.

insert into public.site_content (key, label, type, value, image_url, video_url, storage_path, metadata, is_active)
values
  ('home_background_image', 'Home Background Image', 'background', null, null, null, null, '{"group":"backgrounds","accepts":"image"}'::jsonb, true),
  ('admin_dashboard_background', 'Admin Dashboard Background', 'background', null, null, null, null, '{"group":"backgrounds","accepts":"image"}'::jsonb, true),
  ('default_barber_avatar', 'Default Barber Avatar', 'image', null, null, null, null, '{"group":"media","accepts":"image"}'::jsonb, true),
  ('default_product_image', 'Default Product Image', 'image', null, null, null, null, '{"group":"media","accepts":"image"}'::jsonb, true)
on conflict (key) do nothing;

update public.site_content
set
  image_url = null,
  value = null,
  updated_at = now()
where key in (
  'site_background_image',
  'home_hero_image',
  'services_background_image',
  'login_background_image',
  'service_classic_fade_media',
  'service_fade_with_dye_media',
  'service_brush_with_trim_media',
  'service_beard_trim_media',
  'service_clean_shave_media',
  'service_hair_beard_combo_media'
)
  and storage_path is null;
