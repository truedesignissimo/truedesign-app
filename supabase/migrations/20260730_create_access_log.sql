create table if not exists public.access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('homepage', 'login')),
  accessed_at timestamptz not null default now()
);

alter table public.access_log enable row level security;

create index if not exists access_log_accessed_at_idx
  on public.access_log (accessed_at desc);

create index if not exists access_log_user_id_idx
  on public.access_log (user_id);
