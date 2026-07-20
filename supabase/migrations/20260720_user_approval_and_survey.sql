alter table public.profiles
  add column if not exists approval_status text default 'approved',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

update public.profiles
set
  approval_status = 'approved',
  approved_at = coalesce(approved_at, now())
where approval_status is null;

alter table public.profiles
  alter column approval_status set default 'pending',
  alter column approval_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_approval_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end
$$;

create or replace function public.classify_new_workspace_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_internal boolean := lower(coalesce(new.email, '')) like '%@truedesign.it';
  display_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
begin
  insert into public.profiles (
    id,
    full_name,
    user_type,
    is_admin,
    approval_status,
    approved_at
  ) values (
    new.id,
    display_name,
    case when is_internal then 'interno' else 'cliente' end,
    false,
    case when is_internal then 'approved' else 'pending' end,
    case when is_internal then now() else null end
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    user_type = case when is_internal then 'interno' else public.profiles.user_type end,
    approval_status = case when is_internal then 'approved' else public.profiles.approval_status end,
    approved_at = case
      when is_internal then coalesce(public.profiles.approved_at, now())
      else public.profiles.approved_at
    end;

  return new;
end;
$$;

drop trigger if exists zz_classify_new_workspace_user on auth.users;
create trigger zz_classify_new_workspace_user
  after insert on auth.users
  for each row execute procedure public.classify_new_workspace_user();

create table if not exists public.survey_iconic_responses (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  choices jsonb not null,
  submitted_at timestamptz not null default now()
);

alter table public.survey_iconic_responses enable row level security;

create index if not exists survey_iconic_responses_submitted_at_idx
  on public.survey_iconic_responses (submitted_at desc);

update public.apps
set url = '/apps/true-tetris-pallet'
where name = 'True Tetris Pallet';

update public.apps
set
  url = '/apps/true-sondaggio-iconici',
  visibility = 'pubblica'
where name = 'Sondaggio Prodotti Iconici';
