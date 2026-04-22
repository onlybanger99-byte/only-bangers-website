/*
  Only Bangers - Supabase RBAC + RLS Setup

  Canonical application roles:
  - admin
  - barber
  - customer

  Notes:
  - This script is intended for the current role model used by the app.
  - Supabase service role bypasses RLS automatically.
  - It assumes the protected app areas are:
    - /admin/* for admin
    - /barber/* for barber
    - /portal/* for customer
*/

begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role'
  ) then
    create type public.user_role as enum ('admin', 'barber', 'customer');
  end if;
end
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  assigned_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_roles_role on public.user_roles (role);
create index if not exists idx_user_roles_assigned_at on public.user_roles (assigned_at desc);

alter table public.user_roles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_roles_set_updated_at on public.user_roles;
create trigger trg_user_roles_set_updated_at
before update on public.user_roles
for each row
execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_role(required_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = any(required_roles), false);
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.has_role(public.user_role[]) to authenticated;

drop policy if exists "user_roles_select_self_or_admin" on public.user_roles;
create policy "user_roles_select_self_or_admin"
on public.user_roles
for select
using (
  auth.uid() = user_id
  or public.has_role(array['admin']::public.user_role[])
);

drop policy if exists "user_roles_insert_admin_only" on public.user_roles;
create policy "user_roles_insert_admin_only"
on public.user_roles
for insert
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "user_roles_update_admin_only" on public.user_roles;
create policy "user_roles_update_admin_only"
on public.user_roles
for update
using (public.has_role(array['admin']::public.user_role[]))
with check (public.has_role(array['admin']::public.user_role[]));

drop policy if exists "user_roles_delete_admin_only" on public.user_roles;
create policy "user_roles_delete_admin_only"
on public.user_roles
for delete
using (public.has_role(array['admin']::public.user_role[]));

do $content_items$
begin
  if to_regclass('public.content_items') is not null then
    execute 'alter table public.content_items add column if not exists user_id uuid references auth.users (id) on delete set null';
    execute 'alter table public.content_items add column if not exists barber_id uuid references auth.users (id) on delete set null';
    execute 'create index if not exists idx_content_items_user_id on public.content_items (user_id)';
    execute 'create index if not exists idx_content_items_barber_id on public.content_items (barber_id)';
    execute 'create index if not exists idx_content_items_status on public.content_items (status)';
    execute 'alter table public.content_items enable row level security';

    execute 'drop policy if exists "content_items_select_by_role_scope" on public.content_items';
    execute $sql$
      create policy "content_items_select_by_role_scope"
      on public.content_items
      for select
      using (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
        or auth.uid() = barber_id
      )
    $sql$;

    execute 'drop policy if exists "content_items_insert_by_role_scope" on public.content_items';
    execute $sql$
      create policy "content_items_insert_by_role_scope"
      on public.content_items
      for insert
      with check (
        public.has_role(array['admin', 'barber']::public.user_role[])
        or auth.uid() = user_id
        or auth.uid() = barber_id
      )
    $sql$;

    execute 'drop policy if exists "content_items_update_by_role_scope" on public.content_items';
    execute $sql$
      create policy "content_items_update_by_role_scope"
      on public.content_items
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
      )
    $sql$;
  end if;
end
$content_items$;

do $transactions$
begin
  if to_regclass('public.transactions') is not null then
    execute 'alter table public.transactions add column if not exists user_id uuid references auth.users (id) on delete set null';
    execute 'create index if not exists idx_transactions_user_id on public.transactions (user_id)';
    execute 'create index if not exists idx_transactions_processed_at on public.transactions (processed_at desc)';
    execute 'alter table public.transactions enable row level security';

    execute 'drop policy if exists "transactions_select_by_role_scope" on public.transactions';
    execute $sql$
      create policy "transactions_select_by_role_scope"
      on public.transactions
      for select
      using (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
      )
    $sql$;

    execute 'drop policy if exists "transactions_insert_admin_only" on public.transactions';
    execute $sql$
      create policy "transactions_insert_admin_only"
      on public.transactions
      for insert
      with check (public.has_role(array['admin']::public.user_role[]))
    $sql$;

    execute 'drop policy if exists "transactions_update_admin_only" on public.transactions';
    execute $sql$
      create policy "transactions_update_admin_only"
      on public.transactions
      for update
      using (public.has_role(array['admin']::public.user_role[]))
      with check (public.has_role(array['admin']::public.user_role[]))
    $sql$;
  end if;
end
$transactions$;

do $email_subscribers$
begin
  if to_regclass('public.email_subscribers') is not null then
    execute 'alter table public.email_subscribers add column if not exists user_id uuid references auth.users (id) on delete set null';
    execute 'create index if not exists idx_email_subscribers_user_id on public.email_subscribers (user_id)';
    execute 'create index if not exists idx_email_subscribers_email on public.email_subscribers (lower(email))';
    execute 'alter table public.email_subscribers enable row level security';

    execute 'drop policy if exists "email_subscribers_select_by_role_scope" on public.email_subscribers';
    execute $sql$
      create policy "email_subscribers_select_by_role_scope"
      on public.email_subscribers
      for select
      using (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
        or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    $sql$;

    execute 'drop policy if exists "email_subscribers_insert_self_or_admin" on public.email_subscribers';
    execute $sql$
      create policy "email_subscribers_insert_self_or_admin"
      on public.email_subscribers
      for insert
      with check (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
        or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    $sql$;

    execute 'drop policy if exists "email_subscribers_update_self_or_admin" on public.email_subscribers';
    execute $sql$
      create policy "email_subscribers_update_self_or_admin"
      on public.email_subscribers
      for update
      using (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
        or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
      with check (
        public.has_role(array['admin']::public.user_role[])
        or auth.uid() = user_id
        or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    $sql$;
  end if;
end
$email_subscribers$;

commit;
