alter table if exists public.bookings
add column if not exists ends_at timestamptz;

create index if not exists bookings_barber_id_idx
on public.bookings (barber_id);

create index if not exists bookings_starts_at_idx
on public.bookings (starts_at);

create index if not exists bookings_ends_at_idx
on public.bookings (ends_at);

create index if not exists bookings_status_idx
on public.bookings (status);

create index if not exists bookings_payment_status_idx
on public.bookings (payment_status);

comment on column public.bookings.ends_at is
  'Calculated booking end timestamp used for overlap-safe availability checks.';

comment on table public.bookings is
  'TODO: add a Postgres exclusion constraint for overlapping active barber bookings before higher-scale traffic if schema risk is fully reviewed.';
