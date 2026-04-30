/*
  Only Bangers - Bookings Schema + RLS

  Required booking columns:
  - id
  - user_id
  - barber_id
  - barber_name
  - service_id
  - service_name
  - starts_at
  - status
  - payment_status
  - notes
  - whatsapp_redirect_url
  - amount_due
  - payment_reference
  - pending_expires_at
  - confirmed_at
  - confirmed_by
  - created_at
  - updated_at

  This script assumes the RBAC helpers from `SUPABASE_RBAC_SETUP.sql` already exist:
  - public.user_role
  - public.current_user_role()
  - public.has_role(public.user_role[])
*/

begin;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  barber_id uuid references auth.users (id) on delete set null,
  barber_name text,
  service_id text,
  service_name text not null,
  starts_at timestamptz not null,
  status text not null default 'pending_payment',
  payment_status text not null default 'unpaid',
  notes text,
  whatsapp_redirect_url text,
  amount_due numeric,
  payment_reference text,
  pending_expires_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_status_check check (
    status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'expired')
  ),
  constraint bookings_payment_status_check check (
    payment_status in ('unpaid', 'paid', 'cancelled', 'refunded', 'pending_verification', 'failed')
  )
);

create index if not exists idx_bookings_user_id on public.bookings (user_id);
create index if not exists idx_bookings_barber_id on public.bookings (barber_id);
create index if not exists idx_bookings_starts_at on public.bookings (starts_at);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_payment_status on public.bookings (payment_status);

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_by_role_scope" on public.bookings;
create policy "bookings_select_by_role_scope"
on public.bookings
for select
using (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or auth.uid() = barber_id
);

drop policy if exists "bookings_insert_by_role_scope" on public.bookings;
create policy "bookings_insert_by_role_scope"
on public.bookings
for insert
with check (
  public.has_role(array['admin']::public.user_role[])
  or (public.current_user_role() = 'customer' and auth.uid() = user_id)
  or (public.current_user_role() = 'barber' and auth.uid() = barber_id)
);

drop policy if exists "bookings_update_by_role_scope" on public.bookings;
create policy "bookings_update_by_role_scope"
on public.bookings
for update
using (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or auth.uid() = barber_id
)
with check (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or auth.uid() = barber_id
);

drop policy if exists "bookings_delete_by_role_scope" on public.bookings;
create policy "bookings_delete_by_role_scope"
on public.bookings
for delete
using (
  public.has_role(array['admin']::public.user_role[])
  or auth.uid() = user_id
  or auth.uid() = barber_id
);

commit;
