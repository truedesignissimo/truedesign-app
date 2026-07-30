create table if not exists public.tetris_packaging_rules (
  code text primary key,
  length numeric not null check (length > 0),
  width numeric not null check (width > 0),
  height numeric not null check (height > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id)
);

alter table public.tetris_packaging_rules enable row level security;

drop policy if exists "tetris packaging rules shared access" on public.tetris_packaging_rules;
create policy "tetris packaging rules shared access"
  on public.tetris_packaging_rules
  for all
  to authenticated
  using (public.tetris_pallet_allowed())
  with check (public.tetris_pallet_allowed());
