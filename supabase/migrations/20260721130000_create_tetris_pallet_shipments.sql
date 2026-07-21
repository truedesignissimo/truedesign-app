-- Invariant: a user not assigned to /apps/true-tetris-pallet receives no rows.
-- Invariant: a permitted user can select every shipment, not only own shipments.
-- Invariant: storage object access requires the same assignment.

create table if not exists public.tetris_pallet_shipments (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  order_number text,
  order_series text,
  customer text,
  order_date text,
  destination text,
  source_file_name text,
  source_file_path text,
  source_file_type text,
  source_file_size bigint,
  payload jsonb not null
);

create index if not exists tetris_pallet_shipments_updated_at_idx
  on public.tetris_pallet_shipments (updated_at desc);

create index if not exists tetris_pallet_shipments_customer_idx
  on public.tetris_pallet_shipments (customer);

alter table public.tetris_pallet_shipments enable row level security;

create or replace function public.tetris_pallet_allowed()
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
  ) or exists (
    select 1
    from public.user_apps
    join public.apps on apps.id = user_apps.app_id
    where user_apps.user_id = auth.uid()
      and apps.url = '/apps/true-tetris-pallet'
      and apps.is_active = true
  );
$$;

revoke all on function public.tetris_pallet_allowed() from public;
grant execute on function public.tetris_pallet_allowed() to authenticated;

drop policy if exists "tetris shipment shared access" on public.tetris_pallet_shipments;
create policy "tetris shipment shared access"
  on public.tetris_pallet_shipments
  for all
  to authenticated
  using (public.tetris_pallet_allowed())
  with check (public.tetris_pallet_allowed());

insert into storage.buckets (id, name, public)
values ('true-tetris-pallet-orders', 'true-tetris-pallet-orders', false)
on conflict (id) do update set public = false;

drop policy if exists "tetris shipment source shared access" on storage.objects;
create policy "tetris shipment source shared access"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'true-tetris-pallet-orders'
    and public.tetris_pallet_allowed()
  )
  with check (
    bucket_id = 'true-tetris-pallet-orders'
    and public.tetris_pallet_allowed()
  );
