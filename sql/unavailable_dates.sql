create extension if not exists pgcrypto;

-- 1) Table
create table if not exists public.unavailable_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- 2) Enable RLS
alter table public.unavailable_dates enable row level security;

-- 3) Policies
-- Allow all authenticated users (patients/admins) to read unavailable dates
create policy if not exists "unavailable_dates_select_authenticated"
on public.unavailable_dates
for select
to authenticated
using (true);

-- Allow only admins to insert
create policy if not exists "unavailable_dates_insert_admin"
on public.unavailable_dates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(p.is_admin, false) = true
        or lower(coalesce(p.role, '')) = 'admin'
      )
  )
);

-- Allow only admins to delete
create policy if not exists "unavailable_dates_delete_admin"
on public.unavailable_dates
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(p.is_admin, false) = true
        or lower(coalesce(p.role, '')) = 'admin'
      )
  )
);
