/*
  Only Bangers - Pending payment + WhatsApp checkout bookings migration

  Run after:
  - SUPABASE_RBAC_SETUP.sql
  - BOOKINGS_SCHEMA.sql
  - PROFILES_AND_BOOKING_CONSTRAINTS.sql

  This migration alters the existing bookings table safely and preserves data.
*/

begin;

alter table public.bookings
  add column if not exists payment_status text,
  add column if not exists whatsapp_redirect_url text,
  add column if not exists amount_due numeric,
  add column if not exists payment_reference text,
  add column if not exists pending_expires_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users (id);

update public.bookings
set status = case
  when status = 'pending' then 'pending_payment'
  when status in ('scheduled', 'arrived', 'in_progress') then 'confirmed'
  else status
end
where status in ('pending', 'scheduled', 'arrived', 'in_progress');

update public.bookings
set payment_status = case
  when status = 'pending_payment' then 'pending_verification'
  when status in ('confirmed', 'completed') then 'paid'
  when status in ('cancelled', 'expired') then 'failed'
  else 'unpaid'
end
where payment_status is null;

update public.bookings
set payment_reference = concat('OB-', upper(left(id::text, 8)))
where payment_reference is null;

update public.bookings
set pending_expires_at = coalesce(pending_expires_at, created_at + interval '15 minutes')
where status = 'pending_payment';

update public.bookings
set confirmed_at = coalesce(confirmed_at, created_at)
where status in ('confirmed', 'completed');

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (
    status in (
      'pending_payment',
      'confirmed',
      'cancelled',
      'completed',
      'expired'
    )
  );

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (
    payment_status in (
      'unpaid',
      'pending_verification',
      'paid',
      'failed'
    )
  );

drop index if exists public.bookings_barber_slot_unique;

create index if not exists idx_bookings_pending_expires_at
on public.bookings (pending_expires_at);

create index if not exists idx_bookings_payment_status
on public.bookings (payment_status);

create or replace function public.sync_booking_lifecycle_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending_payment' then
    if new.payment_status is null then
      new.payment_status := 'pending_verification';
    end if;

    if new.pending_expires_at is null then
      new.pending_expires_at := timezone('utc', now()) + interval '15 minutes';
    end if;
  end if;

  if new.status in ('confirmed', 'completed') then
    if new.payment_status is null then
      new.payment_status := 'paid';
    end if;

    if new.confirmed_at is null then
      new.confirmed_at := timezone('utc', now());
    end if;
  end if;

  if new.status in ('cancelled', 'expired') and new.payment_status is null then
    new.payment_status := 'failed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_sync_lifecycle_defaults on public.bookings;
create trigger trg_bookings_sync_lifecycle_defaults
before insert or update on public.bookings
for each row
execute function public.sync_booking_lifecycle_defaults();

create or replace function public.enforce_booking_slot_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conflicting_booking_id uuid;
begin
  if new.barber_id is null or new.starts_at is null then
    return new;
  end if;

  if new.status not in ('pending_payment', 'confirmed', 'completed') then
    return new;
  end if;

  select b.id
  into conflicting_booking_id
  from public.bookings b
  where b.id <> coalesce(new.id, gen_random_uuid())
    and b.barber_id = new.barber_id
    and b.starts_at = new.starts_at
    and (
      b.status in ('confirmed', 'completed')
      or (
        b.status = 'pending_payment'
        and coalesce(b.pending_expires_at, timezone('utc', now()) + interval '15 minutes') > timezone('utc', now())
      )
    )
  limit 1;

  if conflicting_booking_id is not null then
    raise exception 'booking_slot_conflict'
      using errcode = '23505',
            detail = 'The selected barber slot is already reserved or confirmed.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_enforce_slot_availability on public.bookings;
create trigger trg_bookings_enforce_slot_availability
before insert or update of barber_id, starts_at, status, pending_expires_at on public.bookings
for each row
execute function public.enforce_booking_slot_availability();

create or replace function public.get_booked_barber_slots(
  p_barber_id uuid,
  p_day date
)
returns table (starts_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.starts_at
  from public.bookings b
  where b.barber_id = p_barber_id
    and b.starts_at >= (p_day::timestamptz)
    and b.starts_at < ((p_day + 1)::timestamptz)
    and (
      b.status in ('confirmed', 'completed')
      or (
        b.status = 'pending_payment'
        and coalesce(b.pending_expires_at, timezone('utc', now()) + interval '15 minutes') > timezone('utc', now())
      )
    )
  order by b.starts_at asc;
$$;

grant execute on function public.get_booked_barber_slots(uuid, date) to anon;
grant execute on function public.get_booked_barber_slots(uuid, date) to authenticated;

commit;
