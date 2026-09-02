create table if not exists public.survey_iconic_archives (
  id uuid primary key default gen_random_uuid(),
  archived_at timestamptz not null default now(),
  archived_by uuid references auth.users(id) on delete set null,
  response_count integer not null check (response_count >= 0),
  preference_count integer not null check (preference_count >= 0),
  first_response_at timestamptz,
  last_response_at timestamptz,
  restored_at timestamptz,
  restored_by uuid references auth.users(id) on delete set null
);

create table if not exists public.survey_iconic_archive_responses (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.survey_iconic_archives(id) on delete cascade,
  source_response_id uuid not null,
  participant_name text not null,
  choices jsonb not null,
  submitted_at timestamptz not null
);

create index if not exists survey_iconic_archives_archived_at_idx
  on public.survey_iconic_archives (archived_at desc);

create index if not exists survey_iconic_archive_responses_archive_idx
  on public.survey_iconic_archive_responses (archive_id, submitted_at desc);

alter table public.survey_iconic_archives enable row level security;
alter table public.survey_iconic_archive_responses enable row level security;

create or replace function public.archive_and_reset_iconic_survey(actor uuid)
returns table (archive_id uuid, response_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_archive_id uuid;
  current_response_count integer;
  current_preference_count integer;
  first_response timestamptz;
  last_response timestamptz;
begin
  select
    count(*)::integer,
    coalesce(sum(
      case
        when jsonb_typeof(choices) = 'array' then jsonb_array_length(choices)
        else 0
      end
    ), 0)::integer,
    min(submitted_at),
    max(submitted_at)
  into
    current_response_count,
    current_preference_count,
    first_response,
    last_response
  from public.survey_iconic_responses;

  if current_response_count = 0 then
    raise exception using errcode = 'P0001', message = 'no_survey_responses';
  end if;

  insert into public.survey_iconic_archives (
    archived_by,
    response_count,
    preference_count,
    first_response_at,
    last_response_at
  ) values (
    actor,
    current_response_count,
    current_preference_count,
    first_response,
    last_response
  )
  returning id into created_archive_id;

  insert into public.survey_iconic_archive_responses (
    archive_id,
    source_response_id,
    participant_name,
    choices,
    submitted_at
  )
  select
    created_archive_id,
    id,
    participant_name,
    choices,
    submitted_at
  from public.survey_iconic_responses;

  delete from public.survey_iconic_responses;

  return query select created_archive_id, current_response_count;
end;
$$;

create or replace function public.restore_iconic_survey_archive(target_archive uuid, actor uuid)
returns table (restored_count integer, safety_archive_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  source_count integer;
  current_count integer;
  created_safety_archive_id uuid;
begin
  select count(*)::integer
  into source_count
  from public.survey_iconic_archive_responses
  where archive_id = target_archive;

  if source_count = 0 then
    raise exception using errcode = 'P0001', message = 'survey_archive_empty_or_missing';
  end if;

  select count(*)::integer into current_count from public.survey_iconic_responses;

  if current_count > 0 then
    select archived.archive_id
    into created_safety_archive_id
    from public.archive_and_reset_iconic_survey(actor) as archived;
  end if;

  delete from public.survey_iconic_responses;

  insert into public.survey_iconic_responses (id, participant_name, choices, submitted_at)
  select gen_random_uuid(), participant_name, choices, submitted_at
  from public.survey_iconic_archive_responses
  where archive_id = target_archive
  order by submitted_at asc;

  update public.survey_iconic_archives
  set restored_at = now(), restored_by = actor
  where id = target_archive;

  return query select source_count, created_safety_archive_id;
end;
$$;

create or replace function public.delete_iconic_survey_archive(target_archive uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.survey_iconic_archives where id = target_archive;

  if not found then
    raise exception using errcode = 'P0001', message = 'survey_archive_missing';
  end if;
end;
$$;

revoke all on function public.archive_and_reset_iconic_survey(uuid) from public, anon, authenticated;
revoke all on function public.restore_iconic_survey_archive(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_iconic_survey_archive(uuid) from public, anon, authenticated;

grant execute on function public.archive_and_reset_iconic_survey(uuid) to service_role;
grant execute on function public.restore_iconic_survey_archive(uuid, uuid) to service_role;
grant execute on function public.delete_iconic_survey_archive(uuid) to service_role;
