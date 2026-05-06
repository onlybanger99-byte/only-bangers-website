CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_name text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON public.contact_messages(status);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS public.barber_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_profile_id uuid REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS barber_reviews_booking_id_unique
  ON public.barber_reviews(booking_id)
  WHERE booking_id IS NOT NULL;

ALTER TABLE public.barber_profiles
  ADD COLUMN IF NOT EXISTS cutting_location text,
  ADD COLUMN IF NOT EXISTS map_url text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

ALTER TABLE public.barber_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS profile_image_url text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

INSERT INTO public.site_content (key, label, type, value, metadata, is_active)
VALUES (
  'footer_youtube_url',
  'Footer YouTube URL',
  'social_link',
  '',
  '{"group":"social-links"}'::jsonb,
  true
)
ON CONFLICT (key) DO NOTHING;
