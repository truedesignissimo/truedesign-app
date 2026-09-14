create extension if not exists btree_gist;

create table if not exists public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  room_id smallint not null check (room_id between 1 and 4),
  name text not null check (char_length(trim(name)) between 1 and 120),
  date date not null,
  time_start time not null check (time_start >= time '08:00' and time_start < time '18:00'),
  duration smallint not null check (duration in (30, 60, 90, 120, 150, 180)),
  start_minutes integer generated always as (
    (extract(hour from time_start)::integer * 60) + extract(minute from time_start)::integer
  ) stored,
  description text not null default '' check (char_length(description) <= 1000),
  constraint room_bookings_ends_by_six check (
    (extract(hour from time_start)::integer * 60) + extract(minute from time_start)::integer + duration <= 1080
  )
);

create index if not exists room_bookings_schedule_idx
  on public.room_bookings (date, room_id, time_start);

alter table public.room_bookings drop constraint if exists room_bookings_no_overlap;
alter table public.room_bookings add constraint room_bookings_no_overlap
  exclude using gist (
    room_id with =,
    date with =,
    int4range(start_minutes, start_minutes + duration, '[)') with &&
  );

alter table public.room_bookings enable row level security;

create or replace function public.room_bookings_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and coalesce(is_admin, false)
  );
$$;

create or replace function public.room_bookings_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.room_bookings_is_admin() or exists (
    select 1
    from public.user_apps
    join public.apps on apps.id = user_apps.app_id
    where user_apps.user_id = auth.uid()
      and apps.url = '/apps/prenotazione-sale-riunioni'
      and apps.is_active = true
  );
$$;

revoke all on function public.room_bookings_is_admin() from public;
grant execute on function public.room_bookings_is_admin() to authenticated;
revoke all on function public.room_bookings_allowed() from public;
grant execute on function public.room_bookings_allowed() to authenticated;

drop policy if exists "room bookings shared read" on public.room_bookings;
create policy "room bookings shared read"
  on public.room_bookings
  for select
  to authenticated
  using (public.room_bookings_allowed());

drop policy if exists "room bookings create own" on public.room_bookings;
create policy "room bookings create own"
  on public.room_bookings
  for insert
  to authenticated
  with check (public.room_bookings_allowed() and created_by = auth.uid());

drop policy if exists "room bookings update owner or admin" on public.room_bookings;
create policy "room bookings update owner or admin"
  on public.room_bookings
  for update
  to authenticated
  using (public.room_bookings_allowed() and (created_by = auth.uid() or public.room_bookings_is_admin()))
  with check (public.room_bookings_allowed() and (created_by = auth.uid() or public.room_bookings_is_admin()));

drop policy if exists "room bookings delete owner or admin" on public.room_bookings;
create policy "room bookings delete owner or admin"
  on public.room_bookings
  for delete
  to authenticated
  using (public.room_bookings_allowed() and (created_by = auth.uid() or public.room_bookings_is_admin()));

do $$
begin
  alter publication supabase_realtime add table public.room_bookings;
exception
  when duplicate_object then null;
end;
$$;
